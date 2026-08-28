import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Teachers route - to be implemented' });
});

export { router as teacherRoutes };
