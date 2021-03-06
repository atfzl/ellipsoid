import { Fault } from '#/common/models/Fault';
import { readFile, writeFile } from 'fs';
import * as R from 'ramda';
import * as resolve from 'resolve';
import { bindNodeCallback, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as path from 'upath';

export const readFile$ = bindNodeCallback(readFile);
export const writeFile$ = bindNodeCallback(writeFile);
export const readFileToString$ = (fileName: string) =>
  readFile$(fileName).pipe(
    catchError(err =>
      throwError(
        new Fault('Cannot read file', { error: JSON.stringify(err), fileName }),
      ),
    ),
    map(R.toString),
  );

export const getPathRelativeToTarget = (
  sourceFileName: string,
  targetFileName: string,
  relativePath: string,
): Observable<string> => {
  return new Observable(observer => {
    const sourceFileDirPath = path.dirname(sourceFileName);

    resolve(
      relativePath,
      {
        basedir: sourceFileDirPath,
        extensions: ['.ts', '.tsx'],
      },
      (err, resolvedSourceComponentPath) => {
        if (err) {
          return observer.error(
            new Fault('Could not get path relative to target', err),
          );
        }

        const targetFileDirPath = path.dirname(targetFileName);
        const pathFromTargetToSource = path.relative(
          targetFileDirPath,
          resolvedSourceComponentPath!,
        );

        const resultPath = path.trimExt(pathFromTargetToSource);

        if (pathFromTargetToSource.charAt(0) !== '.') {
          observer.next(`./${resultPath}`);
        } else {
          observer.next(resultPath);
        }

        observer.complete();
      },
    );
  });
};
