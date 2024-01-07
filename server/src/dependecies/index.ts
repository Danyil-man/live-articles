import { Express } from 'express';
import express from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';

export default async ({
  expressApp,
}: {
  expressApp: Express;
}): Promise<void> => {
  await mongooseLoader();
  console.log('DB loaded and connected!');

  const userModel = {
    name: 'userModel',
    model: require('../models/user').default,
  };

  const articleModel = {
    name: 'articleModel',
    model: require('../models/article').default,
  };

  const commentModel = {
    name: 'commentModel',
    model: require('../models/comment').default,
  };

  dependencyInjectorLoader({
    models: [userModel, articleModel, commentModel],
  });
  express({ app: expressApp });
  console.log('Express loaded');
};
