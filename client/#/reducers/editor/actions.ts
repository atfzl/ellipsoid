import { TagCursor } from '#/common/models/file';
import { StyleObject } from '#/common/models/Style';
import { Workspace } from '#/models/Editor';
import { FiberNode, Renderer } from '#/models/React';
import actionCreatorFactory from 'typescript-fsa';
import { NodeMap, OverlayEventSource } from './interfaces';

const actionCreator = actionCreatorFactory('EDITOR');

const actions = {
  setWorkspace: actionCreator<Workspace>('setWorkspace'),
  setCanvasDomInternals: actionCreator<{
    doc: Document;
    element: HTMLDivElement;
  }>('setCanvasDomInternals'),
  increaseZoom: actionCreator('increaseZoom'),
  decreaseZoom: actionCreator('decreaseZoom'),
  onCommitFiberRoot: actionCreator<{
    renderer: Renderer;
    rootFiberNode: FiberNode;
    nodeMap: NodeMap;
  }>('onCommitFiberRoot'),
  setSelectedOverlay: actionCreator<
    { id: string; source: OverlayEventSource } | undefined
  >('setSelectedOverlay'),
  setHoveredOverlay: actionCreator<
    { id: string; source: OverlayEventSource } | undefined
  >('setHoveredOverlay'),
  launchEditorForCursor: actionCreator<TagCursor>('launchEditorForCursor'),
  handleDrop: actionCreator<{ source: TagCursor; target: TagCursor }>(
    'handleDrop',
  ),
  setCopiedOverlay: actionCreator<string | undefined>('setCopiedOverlay'),
  setLoading: actionCreator<boolean | undefined>('setLoading'),
  updatePreviewStyle: actionCreator<{
    styles: StyleObject;
  }>('updatePreviewStyle'),
};

export default actions;
