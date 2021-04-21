import { DOMLabel } from './DOMLabel.js'
const { Vec3, Xfo, Color, Material, Lines, Sphere, BillboardItem, GeomItem, Registry } = window.zeaEngine
const { AimOperator } = window.zeaKinematics

let state = {}

function createLabelAndLine(labelData) {
  const { basePos, offset, name, width, color } = labelData
  const ballRadius = labelData.ballRadius ? labelData.ballRadius : 1
  const outlineColor = labelData.outlineColor ? labelData.outlineColor : new Color(0, 0, 0)

  let pos = labelData.pos
  if (!pos) {
    pos = basePos.add(offset)
  }

  if (!state.labelLinesMaterial) {
    state.labelLinesMaterial = new Material('LabelLinesMaterial', 'HandleShader')
    state.labelLinesMaterial.getParameter('BaseColor').setValue(outlineColor)
  }

  if (!state.line) {
    const line = new Lines()
    line.setNumVertices(2)
    line.setNumSegments(1)
    line.setSegmentVertexIndices(0, 0, 1)
    line.getVertexAttribute('positions').getValueRef(1).setFromOther(new Vec3(1, 0, 0))
    state.line = line
  }
  if (!state.ball) {
    state.ball = new Sphere(0.005)
  }

  const labelImage = new DOMLabel(name, 'servo_mestre')
  // labelImage.getParameter('library').setValue('servo_mestre')
  labelImage.getParameter('backgroundColor').setValue(color)
  labelImage.getParameter('outlineColor').setValue(outlineColor)
  labelImage.getParameter('fontSize').setValue(24)
  labelImage.getParameter('borderRadius').setValue(15)
  labelImage.getParameter('margin').setValue(1)
  if (width) labelImage.getParameter('width').setValue(width)

  const billboard = new BillboardItem('Label', labelImage)
  billboard.getParameter('LocalXfo').setValue(new Xfo(pos))
  billboard.getParameter('PixelsPerMeter').setValue(3000)
  billboard.getParameter('AlignedToCamera').setValue(true)
  billboard.getParameter('Alpha').setValue(1.0)

  const lineItem = new GeomItem('LabelLine', state.line, state.labelLinesMaterial)

  const labelBallMaterial = new Material('LabelBallMaterial', 'HandleShader')
  // labelBallMaterial.replaceParameter(new ProxyParameter('BaseColor', labelLinesMaterial.getParameter('Color')))
  const ballColor = color.clone()
  ballColor.a = 0.85
  labelBallMaterial.getParameter('BaseColor').setValue(ballColor)
  const ballItem = new GeomItem('LabelLineBall', state.ball, labelBallMaterial)
  const ballXfo = new Xfo()
  ballXfo.tr = basePos
  ballXfo.sc.set(ballRadius)
  ballItem.getParameter('LocalXfo').setValue(ballXfo)
  // billboard.addChild(ballItem, true);
  const aimOp = Registry.constructClass('AimOperator')
  aimOp.getParameter('Stretch').setValue(1.0)
  aimOp.getInput('Target').setParam(ballItem.getParameter('GlobalXfo'))
  // const proxyOp = new RouterOperator('')
  // proxyOp.addRoute().setParam(aimOp.getParameter('Target'))
  // aimOp.addRoute().setParam(aimOp.getParameter('Target'))
  // aimOp.replaceParameter(new ProxyParameter('Target', ballItem.getParameter('GlobalXfo')))
  aimOp.getOutputByIndex(0).setParam(lineItem.getParameter('GlobalXfo'))
  // lineItem.addComponent(aimOp)

  billboard.addChild(lineItem, false)
  ballItem.addChild(billboard, true)

  ballItem.on('mouseDown', () => {
    ballColor.a = 0.15
    labelBallMaterial.getParameter('BaseColor').setValue(ballColor)
  })

  return {
    billboard,
    ballItem,
  }
}
export { createLabelAndLine }
