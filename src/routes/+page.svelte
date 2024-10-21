<script lang="ts">
  import ConnectScreen from './Connect.svelte';
  import PSUScreen from './KORAD.svelte';
  import { Styles } from '@sveltestrap/sveltestrap';
  
  let connected:boolean = false;
  let port:any;

  async function handleConnect() {
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      connected = true;
    } catch (err) {
      console.error('Connection failed', err);
    }
  }

  async function handleDisconnect() {
    if (port) {
      await port.close();
      connected = false;
    }
  }
</script>

<Styles />

{#if !connected}
  <ConnectScreen on:connect={handleConnect} />
{:else}
  <PSUScreen {port} on:disconnect={handleDisconnect} />
{/if}
