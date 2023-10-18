import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routesV1 from '../api';

export default ({ app }: { app: express.Application }): void => {
  app.enable('trust proxy');

  app.use(helmet());

  app.use(cors());

  app.use(
    express.json({
      limit: '500mb',
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: '500mb',
    }),
  );

  app.use('live-articles', routesV1());

  app.use((_req, _res, next) => {
    const err = new Error('Not Found');
    err['status'] = 404;
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.response?.data?.message) {
      console.log(req.url + ': ' + err.response.data.message);
      return res
        .status(err.response.status)
        .send({
          success: false,
          error: err.response.data.message,
        })
        .end();
    }
    if (err.response?.data?.name) {
      console.log(req.url + ': ' + err.response.data.name);
      return res
        .status(err.response.status)
        .send({
          success: false,
          error: err.response.data.name.join(', '),
        })
        .end();
    }
    if (err.response?.data?.text) {
      console.log(req.url + ': ' + err.response.data.text);
      return res
        .status(err.response.status)
        .send({
          success: false,
          error: err.response.data.text.join(', '),
        })
        .end();
    }
    if (err.response?.data?.error) {
      console.log(req.url + ': ' + err.response.data.error);
      return res
        .status(err.response.status)
        .send({
          success: false,
          error: err.response.data.error,
        })
        .end();
    }

    if (
      err.response?.body?.errors &&
      err.response.body.errors.length &&
      err.response.body.errors[0].message
    ) {
      console.log(req.url + ': ' + err.response.body.errors[0].message);
      return res
        .status(err.status || err.code || 500)
        .send({
          success: false,
          error: err.response.body.errors[0].message,
        })
        .end();
    }

    if (err.name === 'UnauthorizedError') {
      return res
        .status(err.status)
        .send({
          success: false,
          error: err.message,
        })
        .end();
    }

    if (err.code && err.code == 11000) {
      const fields = err.keyValue && Object.keys(err.keyValue);
      const code = 409;
      const message = fields
        ? `An account with that ${fields} already exists.`
        : 'Duplicate field error';
      return res
        .status(code)
        .send({
          success: false,
          error: message,
          errorFields: fields
            ? fields.map((field) => {
                return {
                  field,
                  message: `An account with that ${field} already exists.`,
                };
              })
            : [],
        })
        .end();
    }

    console.log((err.response && err.response.data) || err);

    res.status(err.status || 500);
    const errorObject: any = {
      success: false,
      error: err.message,
    };
    if (err.field) {
      errorObject.errorFields = [
        {
          field: err.field,
          message: err.message,
        },
      ];
    }
    console.log(req.url + ': ' + err.message);
    return res.json(errorObject);
  });
};
