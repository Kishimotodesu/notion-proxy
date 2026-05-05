export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Notion-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const notionKey = process.env.NOTION_KEY;
  const dbId = req.query.db;
  const action = req.query.action;

  try {
    if (action === 'create') {
      const { title, url, category, pubDate } = req.body || {};

      const properties = {
        Name: { title: [{ text: { content: title || '' } }] },
      };
      if (url) properties['URL'] = { url };
      if (category) properties['カテゴリ'] = { select: { name: category } };
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d)) {
          properties['公開日'] = { date: { start: d.toISOString().split('T')[0] } };
        }
      }

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties,
        }),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Default: query database
    const response = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body || {}),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}