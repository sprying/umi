import { Logger } from '@umijs/core';
import immer from '@umijs/deps/compiled/immer';
import * as fs from 'fs';
import { join } from 'path';
import { IHttps, IServerOpts } from './Server';
import certificateFor from 'trusted-cert';

const logger = new Logger('@umijs/server:utils');

export const getCredentials = async (opts: IServerOpts): Promise<IHttps> => {
  const { https, host = 'localhost' } = opts;
  const { keyFilePath, certFilePath } = await certificateFor(host, {
    silent: true,
  });
  const defautlServerOptions: IHttps = {
    key: join(__dirname, 'cert', 'key.pem'),
    cert: join(__dirname, 'cert', 'cert.pem'),
  };
  // custom cert using https: { key: '', cert: '' }
  const serverOptions = (https === true
    ? defautlServerOptions
    : https) as IHttps;
  const credentials = immer(
    {
      ...serverOptions,
      key: fs.readFileSync(keyFilePath, 'utf-8'),
      cert: fs.readFileSync(certFilePath, 'utf-8'),
    },
    (draft: any) => {
      if (typeof serverOptions === 'object' && serverOptions.ca) {
        const newServerOptions = immer(serverOptions, (optDraft: any) => {
          // @ts-ignore
          optDraft.ca = !Array.isArray(optDraft.ca)
            ? [optDraft.ca]
            : optDraft.ca;
        });

        if (Array.isArray(newServerOptions.ca)) {
          // @ts-ignore
          draft.ca = newServerOptions.ca.map(function (ca) {
            return fs.readFileSync(ca, 'utf-8');
          });
        }
      }
    },
  );
  return credentials;
};
