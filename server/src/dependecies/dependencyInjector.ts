import { Container } from 'typedi';

export default ({
  models,
}: {
  models: { name: string; model: any }[];
}): void => {
  try {
    models.forEach((m) => {
      Container.set(m.name, m.model);
    });
  } catch (e) {
    throw new Error(`Error on dependency injector loader: ${e}`);
  }
};
