import { Router } from 'express';

const router = Router();
const orgForms: Record<string, any> = {};

router.get('/profile', (req, res) => {
  const user = (req as any).user || {};
  res.json({
    uid: user.uid,
    email: user.email,
    organizationId: orgForms[user.uid]?.organizationId || null,
  });
});

router.post('/orgForm', (req, res) => {
  const user = (req as any).user || {};
  const { name, size, deviceCategories, regulations } = req.body || {};
  const organizationId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  orgForms[user.uid || 'dev'] = {
    organizationId,
    name,
    size,
    deviceCategories,
    regulations,
  };
  res.json({ organizationId, status: 'saved' });
});

export default router;
