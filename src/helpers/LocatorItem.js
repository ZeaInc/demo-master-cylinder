const { GeomItem, Cross, Material, NumberParameter, Color, BooleanParameter } = window.zeaEngine

let cross
class LocatorItem extends GeomItem {
  constructor(name, size = 0.2, color = null) {
    if (!cross) {
      cross = new Cross()
    }

    let material
    if (color) {
      if (color instanceof Color) {
        material = new Material('LocatorMaterial', 'LinesShader')
        material.getParameter('BaseColor').setValue(color)
      } else if (color instanceof Material) {
        material = color
      }
    }

    super(name, cross, material)

    const sizeParam = this.addParameter(new NumberParameter('Size', size))
    const resize = () => {
      const size = sizeParam.getValue()
      const geomOffsetXfoParam = this.getParameter('GeomOffsetXfo')
      const geomOffsetXfo = geomOffsetXfoParam.getValue()
      geomOffsetXfo.sc.set(size, size, size)
      geomOffsetXfoParam.setValue(geomOffsetXfo)
    }
    sizeParam.on('valueChanged', resize)
    resize()

    this.addParameter(new BooleanParameter('PropagateVisibilityToChildren', false)).on('valueChanged', () => {
      this.propagateVisibilityToChildren = this.getParameter('PropagateVisibilityToChildren').getValue()
    })
    this.propagateVisibilityToChildren = false
  }

  __updateVisibility() {
    const visible = this.__visibleCounter > 0
    if (visible != this.__visible) {
      this.__visible = visible
      if (this.propagateVisibilityToChildren) {
        for (const childItem of this.__childItems) {
          if (childItem instanceof TreeItem) childItem.propagateVisibility(this.__visible ? 1 : -1)
        }
      }
      this.emit('visibilityChanged', { visible })
      return true
    }
    return false
  }
}

export { LocatorItem }
