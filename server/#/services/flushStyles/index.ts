import { TagCursor } from '#/common/models/file';
import { StyleObject } from '#/common/models/Style';
import { ReplacementBuilder } from '#/utils/ReplacementBuilder';
import { findNode$, isAtCursor } from '#/utils/tsNode';
import { createSourceFile$ } from '#/utils/tsSourceFile';
import * as _ from 'lodash/fp';
import * as R from 'ramda';
import { map, pluck, switchMap } from 'rxjs/operators';
import * as ts from 'typescript';

const stringifyStyles = (styleObject: StyleObject) => {
  return R.pipe(
    R.keys,
    R.map(property => `${property}: ${styleObject[property]};`),
    R.join('\n'),
  )(styleObject);
};

const flushStyles$ = R.curry((cursor: TagCursor, styleObject: StyleObject) => {
  return createSourceFile$(cursor.fileName).pipe(
    pluck('file'),
    switchMap(
      findNode$<ts.TaggedTemplateExpression>(
        R.both(isAtCursor(cursor), ts.isTaggedTemplateExpression),
      ),
    ),
    map(cursorNode => {
      const replacementBuilder = new ReplacementBuilder(
        cursorNode.getSourceFile(),
      );

      const styleString = stringifyStyles(styleObject);

      if (ts.isNoSubstitutionTemplateLiteral(cursorNode.template)) {
        replacementBuilder.replaceNodeWithText(
          cursorNode.template,
          '`\n' + styleString + '\n`',
        );
      } else {
        const templateSpansLength = cursorNode.template.templateSpans.length;
        const tail =
          cursorNode.template.templateSpans[templateSpansLength - 1].literal;
        const tailStaticStringMatch = tail.getText().match(/([\w-]*:.*)/);
        const tailStaticStringStartIndex =
          tailStaticStringMatch && tailStaticStringMatch.index
            ? tailStaticStringMatch.index
            : 0;

        const totalLengthWithoutTail =
          cursorNode.template.getText().length - tail.getText().length;

        const tailStaticStringIndexInTemplate =
          totalLengthWithoutTail + tailStaticStringStartIndex;

        const originalTemplateString = _.trimChars(
          '`\n',
          R.slice(0, tailStaticStringIndexInTemplate)(
            cursorNode.template.getText(),
          ),
        );

        replacementBuilder.replaceNodeWithText(
          cursorNode.template,
          '`' + originalTemplateString + styleString + '\n`',
        );
      }

      return replacementBuilder.applyReplacements();
    }),
  );
});

export default flushStyles$;