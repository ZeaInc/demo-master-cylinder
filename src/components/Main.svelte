<script>
  import { onMount } from 'svelte'

  import '../helpers/fps-display'

  import Menu from '../components/ContextMenu/Menu.svelte'
  import MenuOption from '../components/ContextMenu/MenuOption.svelte'
  import Dialog from '../components/Dialog.svelte'
  import ParameterOwnerWidget from './parameters/ParameterOwnerWidget.svelte'

  import Drawer from '../components/Drawer.svelte'
  import ProgressBar from '../components/ProgressBar.svelte'
  import Sidebar from '../components/Sidebar.svelte'
  import SplitPane from '../components/SplitPane.svelte'
  import Pane from '../components/Pane.svelte'

  import { auth } from '../helpers/auth'

  import { APP_DATA } from '../stores/appData'
  import { assets } from '../stores/assets.js'
  import { ui } from '../stores/ui.js'
  import { selectionManager } from '../stores/selectionManager.js'
  import { scene } from '../stores/scene.js'

  import loadAsset from '../helpers/loadAsset.js'
  import setupLearning from '../helpers/setupLearning.js'
  import setupIdentification from '../helpers/setupIdentification.js'
  import setupSimulator from '../helpers/setupSimulator.js'
  import setupAssembly from '../helpers/setupAssembly.js'

  const {
    Color,
    Vec3,
    Xfo,
    TreeItem,
    GLRenderer,
    Scene,
    resourceLoader,
    SystemDesc,
    EnvMap,
    NumberParameter,
    ColorParameter,
    labelManager,
    PassType,
  } = window.zeaEngine
  const { GLCADPass, CADAsset } = window.zeaCad
  const {
    SelectionManager,
    UndoRedoManager,
    ToolManager,
    SelectionTool,
  } = window.zeaUx

  const { Session, SessionSync } = window.zeaCollab

  let assetUrl
  let canvas
  let fpsContainer
  const urlParams = new URLSearchParams(window.location.search)
  let progress

  const filterItemSelection = (item) => {
    // Propagate selections deep in the tree up to the part body.
    while (
      item.getName().startsWith('Mesh') ||
      item.getName().startsWith('Edge') ||
      item.getName().startsWith('TreeItem')
    )
      item = item.getOwner()
    return item
  }

  onMount(async () => {
    const renderer = new GLRenderer(canvas, {
      debugGeomIds: urlParams.has('debugGeomIds'),
      xrCompatible: false,
    })

    $scene = new Scene()

    const cadPass = new GLCADPass()
    cadPass.setShaderPreprocessorValue('#define ENABLE_PBR')
    renderer.addPass(cadPass, PassType.OPAQUE)
    renderer.setScene($scene)
    renderer.resumeDrawing()

    const language = urlParams.get('language')
    if (language) {
      labelManager.setLanguage(language)
    }
    labelManager.loadLibrary('servo_mestre.xlsx', 'data/servo_mestre.xlsx')

    const position = new Vec3({ x: 0.86471, y: 0.87384, z: 0.18464 })
    const target = new Vec3({ x: 0, y: 0.00913, z: -0.03154 })
    renderer.getViewport().getCamera().setPositionAndTarget(position, target)
    $scene
      .getSettings()
      .getParameter('BackgroundColor')
      .setValue(new Color(0.8, 0.8, 0.8))

    if (!SystemDesc.isMobileDevice && renderer.gl.floatTexturesSupported) {
      const envMap = new EnvMap('envMap')
      envMap.getParameter('FilePath').setValue('data/StudioG.zenv')
      envMap.setHDRTint(new Color(1.5, 1.5, 1.5, 1))
      $scene.setEnvMap(envMap)
    }

    //////////////////////////
    // Asset
    const asset = loadAsset()
    $scene.root.addChild(asset)

    asset.once('loaded', () => {
      renderer.frameAll()

      ////////////////////////////////////////////////////////////////
      // States

      const appData = {}

      const stage = urlParams.get('stage')
      switch (stage) {
        case 'learning': {
          setupLearning($scene, asset, renderer, appData)
          break
        }
        case 'identification': {
          setupIdentification($scene, asset, renderer, appData)
          break
        }
        case 'simulation': {
          setupSimulator($scene, asset, renderer, appData)
          break
        }
        case 'assembly': {
          setupAssembly($scene, asset, renderer, appData)
          break
        }
      }
    })

    renderer.getViewport().on('mouseDownOnGeom', (event) => {
      const intersectionData = event.intersectionData
      const geomItem = intersectionData.geomItem
      console.log(geomItem.getPath())
    })
  })

  let isMenuVisible = false
  let pos = { x: 0, y: 0 }
  let contextItem
  const openMenu = (event, item) => {
    contextItem = item
    pos = { x: event.clientX, y: event.clientY }
    isMenuVisible = true
  }
  const closeMenu = () => {
    isMenuVisible = false
  }
  let isDialogOpen = false
  const closeDialog = () => {
    isDialogOpen = false
  }

  $: parameterOwner = null
</script>

<main class="Main flex-1 relative">
  <canvas bind:this={canvas} class="absolute h-full w-full" />
  <div bind:this={fpsContainer} />

  {#if $ui.shouldShowParameterOwnerWidget}
    <ParameterOwnerWidget {parameterOwner} />
  {/if}
</main>

{#if progress < 100}
  <div class="fixed bottom-0 w-full">
    <ProgressBar {progress} />
  </div>
{/if}

<Dialog isOpen={isDialogOpen} close={closeDialog} {contextItem} />

{#if isMenuVisible}
  <Menu {...pos} on:click={closeMenu} on:clickoutside={closeMenu}>
    <MenuOption
      text="Hide"
      on:click={() => {
        contextItem.getParameter('Visible').setValue(false)
      }}
    />
    <MenuOption
      text="Properties"
      on:click={() => {
        if (contextItem) {
          isDialogOpen = true
          closeMenu()
        }
      }}
    />
  </Menu>
{/if}
