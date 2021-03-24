<script>
  import { redirect } from '@roxi/routify'
  import { onMount } from 'svelte'

  const { CameraManipulator } = window.zeaEngine
  const { ToolManager } = window.zeaUx

  import Button from './Button.svelte'
  import Menu from './Menu.svelte'
  import MenuItem from './MenuItem.svelte'
  import MenuItemDropDown from './MenuItemDropDown.svelte'
  import MenuItemToggle from './MenuItemToggle.svelte'
  import MenuBar from './MenuBar.svelte'
  import MenuBarItem from './MenuBarItem.svelte'
  import UserChip from './UserChip.svelte'
  import UsersChips from './UsersChips.svelte'

  import { auth } from '../helpers/auth'

  import { APP_DATA } from '../stores/appData'
  import { ui } from '../stores/ui.js'

  const urlParams = new URLSearchParams(window.location.search)
  const embeddedMode = urlParams.has('embedded')
  let vrToggleMenuItemLabel = 'Detecting VR...'
  let vrToggleMenuItemDisabled = true

  let cameraManipulator
  let isSelectionEnabled = false
  let renderer
  let session
  let sessionSync
  let toolManager
  let undoRedoManager
  let userData

  document.addEventListener('keydown', (event) => {
    const canvasIsTarget = event.target.contains(renderer.getGLCanvas())

    if (!canvasIsTarget) {
      return
    }

    const key = event.key.toLowerCase()

    switch (key) {
      case 'f':
        if (renderer) {
          renderer.frameAll()
        }
        break
      case 'z':
        if (event.ctrlKey && undoRedoManager) {
          undoRedoManager.undo()
        }
        break
      case 'y':
        if (event.ctrlKey && undoRedoManager) {
          undoRedoManager.redo()
        }
        break
    }
  })

  const handleMenuSelectionChange = () => {
    if (!toolManager) {
      return
    }

    isSelectionEnabled
      ? toolManager.pushTool('SelectionTool')
      : toolManager.popTool()
  }

  onMount(() => {
    if (session) {
      session.leaveRoom()
    }

    vrToggleMenuItemLabel = 'VR Device Not Detected'

    APP_DATA.subscribe((appData) => {
      if (!appData || renderer) {
        return
      }

      renderer = appData.renderer
      toolManager = appData.toolManager
      cameraManipulator = appData.cameraManipulator
      undoRedoManager = appData.undoRedoManager
      {
        const { renderer } = $APP_DATA
        renderer
          .getXRViewport()
          .then((xrViewport) => {
            xrViewport.spectatorMode = false // disable by default.
            vrToggleMenuItemLabel = 'Launch VR'
            vrToggleMenuItemDisabled = false
            xrViewport.on('presentingChanged', (event) => {
              const { state } = event
              if (state) {
                vrToggleMenuItemLabel = 'Exit VR'
              } else {
                vrToggleMenuItemLabel = 'Launch VR'
              }
            })
          })
          .catch((reason) => {
            console.warn('Unable to setup XR:' + reason)
          })
      }
    })

    APP_DATA.subscribe((appData) => {
      if (!appData || session || !appData.session || !appData.sessionSync) {
        return
      }

      session = appData.session
      userData = appData.userData
      sessionSync = appData.sessionSync

      // SessionSync interactions.
      window.addEventListener('zeaUserClicked', (event) => {
        const userData = sessionSync.userDatas[event.detail.id]
        if (userData) {
          const avatar = userData.avatar
          const viewXfo = avatar.viewXfo
          const focalDistance = avatar.focalDistance || 1.0
          const target = viewXfo.tr.add(
            viewXfo.ori.getZaxis().scale(-focalDistance)
          )

          if (cameraManipulator)
            cameraManipulator.orientPointOfView(
              viewport.getCamera(),
              viewXfo.tr,
              target,
              1.0,
              1000
            )
        }
      })
    })
  })

  // ////////////////////////////////////
  // UX

  const handleFrameAll = () => {
    const { renderer } = $APP_DATA
    renderer.frameAll()
  }

  const handleUndo = () => {
    const { undoRedoManager } = $APP_DATA
    undoRedoManager.undo()
  }

  const handleRedo = () => {
    const { undoRedoManager } = $APP_DATA
    undoRedoManager.redo()
  }

  let walkModeEnabled = false

  $: if (cameraManipulator) {
    cameraManipulator.enabledWASDWalkMode = walkModeEnabled
  }

  // ////////////////////////////////////
  // Collab

  const handleDA = () => {
    auth.getUserData().then((userData) => {
      if (!userData) {
        return
      }

      const { renderer, sessionSync } = $APP_DATA

      // SessionSync interactions.
      const camera = renderer.getViewport().getCamera()
      const xfo = camera.getParameter('GlobalXfo').getValue()
      const target = camera.getTargetPosition()
      sessionSync.directAttention(xfo.tr, target, 1, 1000)
    })
  }

  // ////////////////////////////////////
  // VR

  const handleLaunchVR = () => {
    const { renderer } = $APP_DATA

    renderer
      .getXRViewport()
      .then((xrViewport) => {
        xrViewport.togglePresenting()
      })
      .catch((reason) => {
        console.warn('Unable to setup XR:' + reason)
      })
  }

  const handleToggleVRSpatatorMode = () => {
    const { renderer } = $APP_DATA
    renderer.getXRViewport().then((xrViewport) => {
      xrViewport.spectatorMode = !xrViewport.spectatorMode
    })
  }

  const handleSignOut = async () => {
    if (session) {
      session.leaveRoom()
    }

    await auth.signOut()
    $redirect('/login')
  }

  const handleClickMenuToggle = () => {
    $ui.shouldShowDrawer = !$ui.shouldShowDrawer
  }
</script>

{#if !embeddedMode}
  <header class="flex items-center px-2 py-1 text-gray-200 z-50">
    <span
      class="material-icons cursor-default mr-2"
      on:click={handleClickMenuToggle}
      title="{$ui.shouldShowDrawer ? 'Close' : 'Open'} drawer"
    >
      {$ui.shouldShowDrawer ? 'menu_open' : 'menu'}
    </span>

    <img class="w-20 mx-3" src="/images/logo-zea.svg" alt="logo" />

    <MenuBar>
      <!--
      <MenuBarItem label="View" let:isOpen>
        <Menu {isOpen}>
          <MenuItem
            label="Frame All"
            iconLeft="crop_free"
            shortcut="F"
            on:click={handleFrameAll}
          />
        </Menu>
      </MenuBarItem>
      -->

      <MenuBarItem label="Edit" let:isOpen>
        <Menu {isOpen}>
          <MenuItem
            label="Undo"
            iconLeft="undo"
            shortcut="Ctrl+Z"
            on:click={handleUndo}
          />
          <MenuItem
            label="Redo"
            iconLeft="redo"
            shortcut="Ctrl+Y"
            on:click={handleRedo}
          />
          <MenuItemToggle
            bind:checked={isSelectionEnabled}
            label="Enable Selection Tool"
            on:change={handleMenuSelectionChange}
            shortcut="S"
          />
          <MenuItemToggle
            bind:checked={walkModeEnabled}
            label="Enable Walk Mode (WASD)"
          />
        </Menu>
      </MenuBarItem>

      <MenuBarItem label="Collab" let:isOpen>
        <Menu {isOpen}>
          <MenuItem
            iconLeft="visibility"
            label="Direct Attention"
            shortcut="Ctrl+N"
            on:click={handleDA}
          />
        </Menu>
      </MenuBarItem>

      <MenuBarItem label="VR" let:isOpen>
        <Menu {isOpen}>
          <MenuItem
            disabled={vrToggleMenuItemDisabled}
            label={vrToggleMenuItemLabel}
            on:click={handleLaunchVR}
          />
          <MenuItem
            label="Enable Spectator Mode"
            on:click={handleToggleVRSpatatorMode}
          />
        </Menu>
      </MenuBarItem>

      <!--
      <MenuBarItem label="More" let:isOpen>
        <Menu {isOpen}>
          <MenuItem label="Foo Bar" shortcut="Ctrl+A" />
          <MenuItem label="Foo Bar" />
          <MenuItem label="Foo Bar" iconLeft="storage" shortcut="Shift+B" />
          <MenuItem label="Foo Bar" />
          <MenuItem label="Foo Bar" shortcut="Alt+C" />
          <MenuItem label="Foo Bar" />
          <MenuItemDropDown label="Foo Bar" let:isOpen>
            <Menu {isOpen}>
              <MenuItem label="Foo Bar" />
              <MenuItem label="Foo Bar" />
            </Menu>
          </MenuItemDropDown>
        </Menu>
      </MenuBarItem>
      -->
    </MenuBar>

    {#if $APP_DATA}
      <UsersChips session={$APP_DATA.session} />
    {/if}

    {#if $APP_DATA}
      <UserChip user={$APP_DATA.userData}>
        <div class="text-center">
          <Button on:click={handleSignOut}>Sign Out</Button>
        </div>
      </UserChip>
    {/if}
  </header>
{/if}
