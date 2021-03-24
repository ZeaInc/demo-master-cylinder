<script>
  import { redirect } from '@roxi/routify'
  import { onMount } from 'svelte'

  import Header from '../components/Header.svelte'
  import Main from '../components/Main.svelte'

  import { auth } from '../helpers/auth'

  let shouldShowLayout

  onMount(async () => {
    //const isAuthenticated = await auth.isAuthenticated()

    //if (isAuthenticated) {
    shouldShowLayout = true
    //} else {
    //const params = new URLSearchParams(location.search)
    //$redirect('/login?' + params.toString())
    //}
  })
</script>

{#if shouldShowLayout}
  <div class="flex flex-col h-full">
    <Header />
    <Main />
  </div>
{/if}
