/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Generator} from '../src/generator';
import {MockFilesystem} from '../testing/mock';

{
  describe('Generator', () => {
    it('generates a correct config', (done: DoneFn) => {
      const fs = new MockFilesystem({
        '/index.html': 'This is a test',
        '/test.txt': 'Another test',
        '/foo/test.html': 'Another test',
        '/ignored/x.html': 'should be ignored',
      });
      const gen = new Generator(fs, '/test');
      const res = gen.process({
        appData: {
          test: true,
        },
        index: '/index.html',
        assetGroups: [{
          name: 'test',
          resources: {
            files: [
              '/**/*.html', '!/ignored/**',
              //                '/*.html',
            ],
            versionedFiles: [
              '/**/*.txt',
            ],
            urls: [
              '/absolute/**',
              '/some/url?with+escaped+chars',
              'relative/*.txt',
            ]
          }
        }],
        dataGroups: [{
          name: 'other',
          urls: [
            '/api/**',
            'relapi/**',
          ],
          cacheConfig: {
            maxSize: 100,
            maxAge: '3d',
            timeout: '1m',
          }
        }],
        navigationUrls: [
          '/included/absolute/**',
          '!/excluded/absolute/**',
          '/included/some/url?with+escaped+chars',
          '!excluded/relative/*.txt',
          'http://example.com/included',
          '!http://example.com/excluded',
        ],
      });
      res.then(config => {
           expect(config).toEqual({
             configVersion: 1,
             appData: {
               test: true,
             },
             index: '/test/index.html',
             assetGroups: [{
               name: 'test',
               installMode: 'prefetch',
               updateMode: 'prefetch',
               urls: [
                 '/test/index.html',
                 '/test/foo/test.html',
                 '/test/test.txt',
               ],
               patterns: [
                 '\\/absolute\\/.*',
                 '\\/some\\/url\\?with\\+escaped\\+chars',
                 '\\/test\\/relative\\/[^\\/]*\\.txt',
               ]
             }],
             dataGroups: [{
               name: 'other',
               patterns: ['\\/api\\/.*', '\\/test\\/relapi\\/.*'],
               strategy: 'performance',
               maxSize: 100,
               maxAge: 259200000,
               timeoutMs: 60000,
               version: 1,
             }],
             navigationUrls: [
               {positive: true, regex: '^\\/included\\/absolute\\/.*$'},
               {positive: false, regex: '^\\/excluded\\/absolute\\/.*$'},
               {positive: true, regex: '^\\/included\\/some\\/url\\?with\\+escaped\\+chars$'},
               {positive: false, regex: '^\\/test\\/excluded\\/relative\\/[^\\/]*\\.txt$'},
               {positive: true, regex: '^http:\\/\\/example\\.com\\/included$'},
               {positive: false, regex: '^http:\\/\\/example\\.com\\/excluded$'},
             ],
             hashTable: {
               '/test/test.txt': '18f6f8eb7b1c23d2bb61bff028b83d867a9e4643',
               '/test/index.html': 'a54d88e06612d820bc3be72877c74f257b561b19',
               '/test/foo/test.html': '18f6f8eb7b1c23d2bb61bff028b83d867a9e4643'
             }
           });
           done();
         })
          .catch(err => done.fail(err));
    });

    it('uses default `navigationUrls` if not provided', (done: DoneFn) => {
      const fs = new MockFilesystem({
        '/index.html': 'This is a test',
      });
      const gen = new Generator(fs, '/test');
      const res = gen.process({
        index: '/index.html',
      });
      res.then(config => {
           expect(config).toEqual({
             configVersion: 1,
             appData: undefined,
             index: '/test/index.html',
             assetGroups: [],
             dataGroups: [],
             navigationUrls: [
               {positive: true, regex: '^\\/.*$'},
               {positive: false, regex: '^\\/(?:.+\\/)?[^\\/]*\\.[^\\/]*$'},
               {positive: false, regex: '^\\/(?:.+\\/)?[^\\/]*__[^\\/]*$'},
               {positive: false, regex: '^\\/(?:.+\\/)?[^\\/]*__[^\\/]*\\/.*$'},
             ],
             hashTable: {}
           });
           done();
         })
          .catch(err => done.fail(err));
    });
  });
}
