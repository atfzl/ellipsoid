import { TagCursor } from '#/common/models/file';
import { ReplacementBuilder } from '#/utils/ReplacementBuilder';
import {
  DeclarationStatement,
  findAncestorNode,
  findElementAtCursor$,
  isDeclarationStatement,
  traverseElement,
} from '#/utils/tsNode';
import { getDeclarationIdentifiersAtSourceFile } from '#/utils/tsNode/getDeclarationIdentifiers';
import * as R from 'ramda';
import { forkJoin } from 'rxjs';
import { concatMap, map, switchMap, toArray } from 'rxjs/operators';
import handleEachChildElement from './handleEachChildElement';
import handleRecursiveDefinitions from './handleRecursiveDefinitions';

const copyElement = (sourceCursor: TagCursor, targetCursor: TagCursor) =>
  forkJoin(
    findElementAtCursor$(sourceCursor),
    findElementAtCursor$(targetCursor),
  ).pipe(
    switchMap(([sourceCursorNode, targetCursorNode]) =>
      forkJoin(
        getDeclarationIdentifiersAtSourceFile(sourceCursorNode.getSourceFile()),
        getDeclarationIdentifiersAtSourceFile(targetCursorNode.getSourceFile()),
      ).pipe(
        switchMap(
          ([
            sourceFileDeclarationIdentifiers,
            targetFileDeclarationIdentifiers,
          ]) => {
            const targetFileDeclarationIdentifiersText = targetFileDeclarationIdentifiers.map(
              x => x.getText(),
            );

            const rb = new ReplacementBuilder(sourceCursorNode);
            const insertionsMap = new Map<
              DeclarationStatement,
              ReplacementBuilder
            >();

            return traverseElement(sourceCursorNode).pipe(
              concatMap(
                handleEachChildElement(rb, sourceFileDeclarationIdentifiers),
              ),
              map(({ node, definition }) => {
                return {
                  node,
                  nodeDeclaration: findAncestorNode<DeclarationStatement>(
                    isDeclarationStatement,
                  )(node)!,
                  definition,
                  definitionDeclaration: findAncestorNode<DeclarationStatement>(
                    isDeclarationStatement,
                  )(definition)!,
                };
              }),
              concatMap(
                handleRecursiveDefinitions(
                  rb,
                  sourceCursor,
                  targetCursor,
                  insertionsMap,
                  targetFileDeclarationIdentifiersText,
                ),
              ),
              toArray(),
              map(() => {
                const insertions = Array.from(insertionsMap.values())
                  .map(a => a.applyReplacements())
                  .reverse();

                return {
                  jsx: rb.applyReplacements(),
                  insertions: R.groupBy(
                    a => (a.startsWith('import') ? 'imports' : 'declarations'),
                    insertions,
                  ),
                  targetCursorNode,
                };
              }),
            );
          },
        ),
      ),
    ),
  );

export default copyElement;
