// routes/ownerRoutes.js
import express from 'express';
import * as ownerController from '../controllers/owner.js';

const router = express.Router();

router.get('/owners', ownerController.getAllOwners);
router.get('/owners/:id', ownerController.getOwnerById);
router.post('/owners', ownerController.createOwner);

export default router;
