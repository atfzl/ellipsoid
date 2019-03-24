import { readFileToString$ } from '#/utils/file';
import * as _ from 'lodash';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import * as ts from 'typescript';

export const createSourceFileFromText = (fileName: string, text: string) => {
  const file = ts.createSourceFile(
    fileName,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    _.endsWith(fileName, 'tsx') ? ts.ScriptKind.TSX : undefined,
  );

  return { file, text };
};

export const createSourceFile$ = (fileName: string) =>
  readFileToString$(fileName).pipe(
    switchMap(text => of(createSourceFileFromText(fileName, text))),
  );
