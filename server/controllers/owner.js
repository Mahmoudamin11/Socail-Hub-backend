// controllers/ownerController.js
import Owner from '../models/Owner.js';
import { createError } from '../error.js';
import { addHistory } from '../controllers/historyController.js'; // Import the function to add history entries

export const getAllOwners = async (req, res, next) => {
  try {
    const owners = await Owner.find();
    res.status(200).json({ success: true, owners });
  } catch (error) {
    console.error('Error getting owners:', error);
    next(createError(500, 'Error getting owners.'));
  }
};

export const getOwnerById = async (req, res, next) => {
  const ownerId = req.params.id;

  try {
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner not found.' });
    }

    res.status(200).json({ success: true, owner });
  } catch (error) {
    console.error('Error getting owner by ID:', error);
    next(createError(500, 'Error getting owner.'));
  }
};

export const createOwner = async (req, res, next) => {
  const { name, age } = req.body;

  try {
    const newOwner = await Owner.create({ name, age });
    res.status(201).json({ success: true, message: 'Owner created successfully.', owner: newOwner });
  } catch (error) {
    console.error('Error creating owner:', error);
    next(createError(500, 'Error creating owner.'));
  }
};
