import mongoose from 'mongoose';
import { ICategory } from '../interfaces/ICategory';

const Category = new mongoose.Schema(
  {
    name: String,
  },

  { timestamps: true, versionKey: false },
);

export default mongoose.model<ICategory & mongoose.Document>(
  'Category',
  Category,
);
