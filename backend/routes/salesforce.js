import express from 'express';
import axios from 'axios';

const router = express.Router();

const FIELD_MAP = {
  Account:     ['Id','Name','Industry','Phone','Website','AnnualRevenue','Type','Rating'],
  Opportunity: ['Id','Name','StageName','Amount','CloseDate','Probability','Type','LeadSource'],
  Lead:        ['Id','FirstName','LastName','Company','Email','Phone','Status','LeadSource'],
  Contact:     ['Id','FirstName','LastName','Email','Phone','Title','Department','AccountId'],
  Case:        ['Id','CaseNumber','Subject','Status','Priority','Origin','Type','Description']
};

const READONLY_FIELDS = new Set(['Id','CaseNumber','CreatedDate','LastModifiedDate']);

const authGuard = (req, res, next) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Login karo pehle' });
  }
  next();
};

const sfClient = (req) => axios.create({
  baseURL: `${req.session.instanceUrl}/services/data/v60.0`,
  headers: {
    Authorization: `Bearer ${req.session.accessToken}`,
    'Content-Type': 'application/json'
  }
});

router.get('/:object', authGuard, async (req, res) => {
  const { object } = req.params;
  const offset = parseInt(req.query.offset) || 0;
  const limit = 20;
  const fields = FIELD_MAP[object];

  if (!fields) return res.status(400).json({ error: 'Invalid object' });

  const soql = `SELECT ${fields.join(',')} FROM ${object} ORDER BY CreatedDate DESC LIMIT ${limit} OFFSET ${offset}`;

  try {
    const { data } = await sfClient(req).get(`/query?q=${encodeURIComponent(soql)}`);
    res.json({ records: data.records, done: data.done, fields });
  } catch (err) {
    console.error('Query error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

router.post('/:object', authGuard, async (req, res) => {
  try {
    const payload = cleanPayload(req.body);
    const { data } = await sfClient(req).post(`/sobjects/${req.params.object}`, payload);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

router.patch('/:object/:id', authGuard, async (req, res) => {
  try {
    const payload = cleanPayload(req.body);
    await sfClient(req).patch(`/sobjects/${req.params.object}/${req.params.id}`, payload);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

router.delete('/:object/:id', authGuard, async (req, res) => {
  try {
    await sfClient(req).delete(`/sobjects/${req.params.object}/${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

function cleanPayload(body) {
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    if (READONLY_FIELDS.has(k)) continue;
    if (v === '' || v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export default router;