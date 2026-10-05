import express from 'express';
import fs from 'fs';
import path from 'path';
import { pool } from '../config/db.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Active SSE client connections (Admin dashboards for live real-time sync)
const sseClients = new Set();

function broadcastNewRegistration(order) {
  const payload = `data: ${JSON.stringify({ type: 'new_registration', order })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

function broadcastOrderUpdate(order) {
  const payload = `data: ${JSON.stringify({ type: 'order_updated', order })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

function broadcastOrderDeleted(orderId) {
  const payload = `data: ${JSON.stringify({ type: 'order_deleted', id: Number(orderId) })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Live SSE stream for Admin Dashboard instant synchronization
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (res.flushHeaders) res.flushHeaders();

  sseClients.add(res);

  // Initial connect message
  res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`);

  // Heartbeat ping every 25s
  const interval = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      clearInterval(interval);
      sseClients.delete(res);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(interval);
    sseClients.delete(res);
  });
});

// Helper: Format Ethiopian phone number
const formatPhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+251' + cleaned.substring(1);
  }
  return cleaned;
};

// Helper: Automatically dispatch instant notification directly to artist's Telegram via Telegram Bot API
export async function sendTelegramAlert(booking, reqFile) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('[Telegram Alert] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured yet in .env');
    return false;
  }

  let caption = '';

  if (booking.is_wedding_or_group) {
    const groupCount = booking.group_size || 3;
    let membersList = '';
    if (booking.group_members) {
      try {
        const members = typeof booking.group_members === 'string' ? JSON.parse(booking.group_members) : booking.group_members;
        if (Array.isArray(members) && members.length > 0) {
          members.forEach((m, idx) => {
            membersList += `  ${idx + 1}. <b>${m.name || 'Guest'}</b>` + 
              (m.phone ? ` • <code>${m.phone}</code>` : '') + 
              (m.address ? `\n     📍 ${m.address}` : '') + `\n`;
          });
        }
      } catch (e) {
        membersList = `  ${booking.group_members}\n`;
      }
    }

    caption = 
      `💍 <b>NEW VIP GROUP / BRIDAL BOOKING!</b>\n` +
      `👥 <b>Booking Type:</b> <b>GROUP SESSION (${groupCount} PEOPLE)</b>\n\n` +
      `👑 <b>Lead Host / Organizer:</b> ${booking.client_name}\n` +
      `📞 <b>Host Phone:</b> <code>${booking.client_phone}</code>\n` +
      `📍 <b>Venue / Session Address:</b> <b>${booking.client_address || 'Kombolcha'}</b>\n` +
      `📅 <b>Group Session Date:</b> ${booking.appointment_date}\n` +
      `✨ <b>Treatments Selected:</b> ${booking.services_selected}\n\n` +
      `📋 <b>INDIVIDUAL GUEST DETAILS (${groupCount} GUESTS):</b>\n` +
      (membersList || `  1. ${booking.client_name} - ${booking.client_phone}\n`) +
      `\n` +
      (booking.notes ? `📝 <b>Group Notes:</b> ${booking.notes}\n` : '') +
      `🆔 <b>Group Booking ID:</b> #${booking.id}\n` +
      `🌐 <i>Saved to Admin Dashboard (Single Group Session)</i>`;
  } else {
    caption = 
      `💅 <b>New Individual Client Booking!</b>\n\n` +
      `👤 <b>Client:</b> ${booking.client_name}\n` +
      `📞 <b>Phone:</b> <code>${booking.client_phone}</code>\n` +
      `📍 <b>Location/Address:</b> <b>${booking.client_address || 'Kombolcha'}</b>\n` +
      `📅 <b>Preferred Date:</b> ${booking.appointment_date}\n` +
      `✨ <b>Treatments:</b> ${booking.services_selected}\n` +
      (booking.notes ? `📝 <b>Client Notes:</b> ${booking.notes}\n` : '') +
      `\n🆔 <b>Booking ID:</b> #${booking.id}\n` +
      `🌐 <i>Saved to Admin Dashboard</i>`;
  }

  try {
    let photoPath = null;
    let photoFilename = 'nail_art.jpg';
    let extraPhotos = [];

    // 1. Top priority: Custom Inspo photo(s) uploaded by the client
    if (booking.inspo_image_url) {
      const inspoList = booking.inspo_image_url.split(',').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < inspoList.length; i++) {
        const item = inspoList[i];
        const cleanPath = item.replace(/^\/+/, '');
        const candidatePaths = [
          path.resolve(process.cwd(), cleanPath),
          path.resolve(cleanPath),
          path.join(process.cwd(), 'uploads', path.basename(cleanPath)),
        ];
        for (const cPath of candidatePaths) {
          if (fs.existsSync(cPath)) {
            if (!photoPath) {
              photoPath = cPath;
              photoFilename = path.basename(cPath);
            } else {
              extraPhotos.push({ path: cPath, filename: path.basename(cPath), index: i + 1 });
            }
            break;
          }
        }
      }
    }

    // 2. Second priority: Uploaded files from multer request
    if (!photoPath && reqFile) {
      const files = Array.isArray(reqFile) ? reqFile : [reqFile];
      for (const f of files) {
        if (f && f.path && fs.existsSync(f.path)) {
          photoPath = f.path;
          photoFilename = f.originalname || path.basename(f.path);
          break;
        }
      }
    }

    // 3. Third priority: Treatment pictures from services catalog (All selected treatments)
    if (booking.services_selected) {
      try {
        const selectedList = booking.services_selected.split(',').map(s => s.trim()).filter(Boolean);
        for (let sIdx = 0; sIdx < selectedList.length; sIdx++) {
          const serviceName = selectedList[sIdx];
          const sResult = await pool.query(
            'SELECT name, image_url FROM services WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) OR LOWER(name) LIKE LOWER($2) LIMIT 1',
            [serviceName, `%${serviceName}%`]
          );
          if (sResult.rows.length > 0 && sResult.rows[0].image_url) {
            const relPath = sResult.rows[0].image_url.replace(/^\/+/, '');
            const candidatePaths = [
              path.resolve(process.cwd(), relPath),
              path.resolve(relPath),
              path.join(process.cwd(), 'uploads', path.basename(relPath)),
            ];
            for (const cPath of candidatePaths) {
              if (fs.existsSync(cPath)) {
                if (!photoPath) {
                  photoPath = cPath;
                  photoFilename = path.basename(cPath);
                } else if (!extraPhotos.some(ep => ep.path === cPath) && cPath !== photoPath) {
                  extraPhotos.push({
                    path: cPath,
                    filename: path.basename(cPath),
                    index: sIdx + 1,
                    serviceName: sResult.rows[0].name || serviceName,
                  });
                }
                break;
              }
            }
          }
        }
      } catch (lookupErr) {
        console.warn('[Telegram Alert] Service photo lookup:', lookupErr.message);
      }
    }

    // Dispatch primary photo with retry logic (up to 3 attempts)
    if (photoPath && fs.existsSync(photoPath)) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const fileBytes = fs.readFileSync(photoPath);
          const ext = path.extname(photoFilename).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          const blob = new Blob([fileBytes], { type: mimeType });
          const form = new FormData();
          form.append('chat_id', chatId);
          form.append('caption', caption);
          form.append('parse_mode', 'HTML');
          form.append('photo', blob, photoFilename);

          const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            body: form,
          });
          const data = await response.json();
          if (data.ok) {
            console.log(`[Telegram Alert] ✓ Primary photo alert (${photoFilename}) delivered to Telegram ID: ${chatId}`);

            // Dispatch any additional photos (all additional selected treatments or inspo images)
            if (extraPhotos.length > 0) {
              for (const extra of extraPhotos) {
                try {
                  const extraBytes = fs.readFileSync(extra.path);
                  const extraExt = path.extname(extra.filename).toLowerCase();
                  const extraMime = extraExt === '.png' ? 'image/png' : extraExt === '.webp' ? 'image/webp' : 'image/jpeg';
                  const extraBlob = new Blob([extraBytes], { type: extraMime });
                  const extraForm = new FormData();
                  extraForm.append('chat_id', chatId);
                  const extraCaption = extra.serviceName
                    ? `💅 <b>Treatment #${extra.index}: ${extra.serviceName}</b> for Booking #${booking.id} (${booking.client_name})`
                    : `📸 <b>Additional Inspo #${extra.index}</b> for Booking #${booking.id} (${booking.client_name})`;
                  extraForm.append('caption', extraCaption);
                  extraForm.append('parse_mode', 'HTML');
                  extraForm.append('photo', extraBlob, extra.filename);
                  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: extraForm });
                } catch (e) {
                  console.warn('[Telegram Alert] Extra photo error:', e.message);
                }
              }
            }

            return true;
          } else {
            console.warn(`[Telegram Alert] sendPhoto attempt ${attempt} rejected:`, data.description);
          }
        } catch (photoErr) {
          console.warn(`[Telegram Alert] Photo dispatch attempt ${attempt} error:`, photoErr.message);
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 1200));
          }
        }
      }
    }

    // Fallback or text-only dispatch
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: caption,
        parse_mode: 'HTML',
      }),
    });
    const data = await response.json();
    if (data.ok) {
      console.log('[Telegram Alert] ✓ Automated text alert delivered to Telegram ID:', chatId);
      return true;
    } else {
      console.error('[Telegram Alert] Telegram API returned error:', data.description);
      return false;
    }
  } catch (err) {
    console.error('[Telegram Alert] Error sending automated notification:', err);
    return false;
  }
}

// Helper: Dispatch instant cancellation notification to artist's Telegram
export async function sendTelegramCancellationAlert(booking) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const reason = booking.cancellation_reason || 'Client requested cancellation';
  const text = 
    `❌ <b>APPOINTMENT CANCELLED</b>\n\n` +
    `🆔 <b>Order #${booking.id}</b>\n` +
    `👤 <b>Client:</b> ${booking.client_name}\n` +
    `📞 <b>Phone:</b> <code>${booking.client_phone}</code>\n` +
    `💅 <b>Service:</b> ${booking.services_selected || 'Nail Treatment'}\n` +
    `📅 <b>Date:</b> ${booking.appointment_date}\n\n` +
    `📝 <b>Reason for Cancellation:</b>\n` +
    `👉 <i>${reason}</i>\n\n` +
    `🌐 <i>Live-synced to Admin Dashboard & Client Portal</i>`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`[Telegram Alert] ✓ Cancellation alert for Order #${booking.id} delivered to Telegram`);
      return true;
    } else {
      console.warn('[Telegram Alert] Telegram returned error on cancellation:', data.description);
      return false;
    }
  } catch (err) {
    console.warn('[Telegram Alert] Cancellation dispatch error:', err.message);
    return false;
  }
}

// 1. GET booked slots for a specific date (Double-booking prevention)
router.get('/booked-slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date query parameter is required (YYYY-MM-DD)' });
    }

    const result = await pool.query(
      `SELECT appointment_time 
       FROM registrations 
       WHERE appointment_date = $1 
         AND status NOT IN ('cancelled')`,
      [date]
    );

    const bookedSlots = result.rows.map(row => row.appointment_time);
    res.json({ success: true, date, bookedSlots });
  } catch (error) {
    console.error('Error checking booked slots:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1.5 GET registrations for client booking history (by phone or latest 5 by default)
router.get('/history', async (req, res) => {
  try {
    const { phone } = req.query;

    let result;
    if (phone && phone.trim() !== '') {
      let cleanPhone = phone.replace(/[\s\-\+]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
      if (cleanPhone.startsWith('251')) cleanPhone = cleanPhone.substring(3);

      result = await pool.query(
        `SELECT id, client_name, client_phone, client_email, client_address, category_type,
                services_selected, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
                appointment_time, is_wedding_or_group, group_size,
                inspo_image_url, notes, group_members, status, cancellation_reason, negotiated_price, created_at
         FROM registrations 
         WHERE client_phone LIKE $1 OR client_phone LIKE $2
         ORDER BY id DESC`,
        [`%${cleanPhone}`, `%${phone.trim()}%`]
      );
    } else {
      // By default: return latest 5 salon appointments
      result = await pool.query(
        `SELECT id, client_name, client_phone, client_email, client_address, category_type,
                services_selected, TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
                appointment_time, is_wedding_or_group, group_size,
                inspo_image_url, notes, group_members, status, cancellation_reason, negotiated_price, created_at
         FROM registrations 
         ORDER BY id DESC
         LIMIT 5`
      );
    }

    const enriched = result.rows.map(item => {
      const formattedPhone = formatPhone(item.client_phone);
      return {
        ...item,
        formatted_phone: formattedPhone,
        artist_phone: process.env.ARTIST_PHONE || '+251956645851',
        call_link: `tel:${process.env.ARTIST_PHONE || '+251956645851'}`,
        telegram_link: `https://t.me/${process.env.ARTIST_TELEGRAM || 'Bonkersss'}?text=${encodeURIComponent(
          `Hi Bonkersss! Inquiring about my booking #${item.id} for ${item.services_selected || 'Nail Treatment'} on ${item.appointment_date} at ${item.appointment_time}.`
        )}`
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.error('Error fetching client booking history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET all registrations / orders (for Admin Dashboard)
router.get('/', async (req, res) => {
  try {
    const { status, category, date } = req.query;
    let query = 'SELECT * FROM registrations';
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (category && category !== 'all') {
      params.push(category);
      conditions.push(`category_type = $${params.length}`);
    }

    if (date) {
      params.push(date);
      conditions.push(`appointment_date = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
    
    // Add formatted phone and direct links (resolving client Telegram by phone)
    const enrichedData = result.rows.map(order => {
      const formattedPhone = formatPhone(order.client_phone);
      const cleanDigits = (formattedPhone || '').replace(/\+/g, '');
      const greetingMsg = encodeURIComponent(
        `Hi ${order.client_name || ''}! This is Beauty Abyssi regarding your nail booking #${order.id} for ${order.services_selected || 'Nail Treatment'}.`
      );
      return {
        ...order,
        formatted_phone: formattedPhone,
        call_link: `tel:${formattedPhone}`,
        client_phone_digits: cleanDigits,
        telegram_link: cleanDigits ? `https://t.me/+${cleanDigits}?text=${greetingMsg}` : `https://t.me/${process.env.ARTIST_TELEGRAM || 'Bonkersss'}`,
      };
    });

    res.json({ success: true, count: enrichedData.length, data: enrichedData });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST new client registration / booking (with conflict prevention)
router.post('/', upload.any(), async (req, res) => {
  try {
    const {
      client_name,
      client_phone,
      client_email,
      category_type,
      services_selected,
      appointment_date,
      appointment_time,
      client_address,
      is_wedding_or_group,
      group_size,
      notes,
    } = req.body;

    const finalAppointmentTime = appointment_time && appointment_time.trim() !== '' 
      ? appointment_time 
      : 'Flexible Time';

    const finalLocation = client_address && client_address.trim() !== ''
      ? client_address.trim()
      : 'Kombolcha';

    if (!client_name || !client_phone || !appointment_date) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, and preferred date are required.',
      });
    }

    // Double-booking check: Only prevent booking if a specific time slot (not flexible) is provided
    if (!finalAppointmentTime.toLowerCase().includes('flexible')) {
      const existing = await pool.query(
        `SELECT id FROM registrations 
         WHERE appointment_date = $1 
           AND appointment_time = $2 
           AND status NOT IN ('cancelled')`,
        [appointment_date, finalAppointmentTime]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `The time slot (${finalAppointmentTime}) on ${appointment_date} is already booked. Please choose a different date.`,
        });
      }
    }

    let inspo_image_url = req.body.inspo_image_url || null;
    const uploadedFiles = req.files || (req.file ? [req.file] : []);
    if (uploadedFiles.length > 0) {
      inspo_image_url = uploadedFiles.map(f => `/uploads/${f.filename}`).join(',');
    }

    let group_members = null;
    if (req.body.group_members) {
      group_members = typeof req.body.group_members === 'string'
        ? req.body.group_members
        : JSON.stringify(req.body.group_members);
    }

    const formattedClientPhone = formatPhone(client_phone);

    const query = `
      INSERT INTO registrations (
        client_name, client_phone, client_email, category_type,
        services_selected, appointment_date, appointment_time,
        client_address, is_wedding_or_group, group_size, inspo_image_url, notes, group_members, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
      RETURNING *
    `;

    const values = [
      client_name.trim(),
      formattedClientPhone,
      client_email ? client_email.trim() : null,
      category_type || 'General',
      services_selected || 'Custom Nail Art',
      appointment_date,
      finalAppointmentTime,
      finalLocation,
      is_wedding_or_group === true || is_wedding_or_group === 'true',
      group_size ? parseInt(group_size, 10) : 1,
      inspo_image_url,
      notes || '',
      group_members,
    ];

    const result = await pool.query(query, values);
    const newOrder = result.rows[0];

    // Instantly sync lively and directly to open Admin Dashboards via Server-Sent Events
    broadcastNewRegistration(newOrder);

    // Automatically trigger instant Telegram push alert directly to the artist's phone
    sendTelegramAlert(newOrder, uploadedFiles).catch(err => {
      console.error('[Telegram Alert] Background dispatch error:', err);
    });

    // Generate direct Telegram link for client to notify @Bonkersss
    const artistTg = process.env.ARTIST_TELEGRAM || 'Bonkersss';
    const isGroup = is_wedding_or_group === true || is_wedding_or_group === 'true';
    const groupCount = group_size ? parseInt(group_size, 10) : 3;

    const tgMsg = encodeURIComponent(
      isGroup
        ? `💍 New VIP Group Booking for Beauty Abyssi!\n` +
          `👥 Party Size: ${groupCount} People (Group Session)\n` +
          `👑 Host / Organizer: ${client_name}\n` +
          `📞 Phone: ${formattedClientPhone}\n` +
          `📍 Venue: ${finalLocation}\n` +
          `📅 Date: ${appointment_date}\n` +
          `✨ Treatments: ${services_selected}\n` +
          (notes ? `📝 Note: ${notes}\n` : '')
        : `💅 New Booking for Beauty Abyssi!\n` +
          `👤 Client: ${client_name}\n` +
          `📞 Phone: ${formattedClientPhone}\n` +
          `📍 Location: ${finalLocation}\n` +
          `📅 Date: ${appointment_date}\n` +
          (finalAppointmentTime !== 'Flexible / Coordinated on Telegram' ? `⏰ Time: ${finalAppointmentTime}\n` : '') +
          `✨ Services: ${services_selected}\n` +
          (inspo_image_url ? `📸 Inspo Attached: YES\n` : '') +
          (notes ? `📝 Note: ${notes}\n` : '')
    );
    const clientToArtistTgUrl = `https://t.me/${artistTg}?text=${tgMsg}`;

    res.status(201).json({
      success: true,
      message: 'Registration created successfully!',
      data: newOrder,
      telegramNotificationUrl: clientToArtistTgUrl,
      artistTelegram: `@${artistTg}`,
      artistPhone: process.env.ARTIST_PHONE || '+251956645851',
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. PATCH update status or negotiated price (for Admin)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, negotiated_price, notes, cancellation_reason } = req.body;

    const fields = [];
    const values = [];

    if (status !== undefined) {
      values.push(status);
      fields.push(`status = $${values.length}`);
    }

    if (cancellation_reason !== undefined) {
      values.push(cancellation_reason);
      fields.push(`cancellation_reason = $${values.length}`);
    }

    if (negotiated_price !== undefined) {
      values.push(negotiated_price === '' ? null : parseFloat(negotiated_price));
      fields.push(`negotiated_price = $${values.length}`);
    }

    if (notes !== undefined) {
      values.push(notes);
      fields.push(`notes = $${values.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update' });
    }

    values.push(id);
    const query = `UPDATE registrations SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updatedOrder = result.rows[0];

    // Live-broadcast update to open Admin and Client dashboards
    broadcastOrderUpdate(updatedOrder);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4.5. DELETE all registrations for a client by phone (Wholly clear history)
router.delete('/history/all', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ success: false, message: 'Phone number is required to clear history.' });
    }

    let cleanPhone = phone.replace(/[\s\-\+]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('251')) cleanPhone = cleanPhone.substring(3);

    const result = await pool.query(
      `DELETE FROM registrations 
       WHERE client_phone LIKE $1 OR client_phone LIKE $2 
       RETURNING id`,
      [`%${cleanPhone}`, `%${phone.trim()}%`]
    );

    res.json({
      success: true,
      message: `Cleared ${result.rows.length} booking records successfully.`,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error clearing client booking history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4.9. DELETE ALL registrations (Admin master wipe)
router.delete('/all', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM registrations RETURNING id');
    res.json({
      success: true,
      message: `All ${result.rows.length} appointment records deleted successfully.`,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error deleting all registrations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. DELETE single registration
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM registrations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    broadcastOrderDeleted(id);

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
