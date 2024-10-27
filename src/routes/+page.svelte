<script lang="ts">
  import ConnectScreen from './Connect.svelte';
  import PSUScreen from './KORAD.svelte';
  import { Styles } from '@sveltestrap/sveltestrap';
  import { Alert } from '@sveltestrap/sveltestrap';
  let connected:boolean = false;
  let port:any;
  let serialAlert:boolean = false;
  async function handleConnect() {
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialAlert = false;
      connected = true;
    } catch (err) {
      console.error('Connection failed', err);
      serialAlert = true;
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
  <Alert color="danger" isOpen={serialAlert}>
    Serial port is already open
  </Alert>
  <ConnectScreen on:connect={handleConnect} />
{:else}
  <PSUScreen {port} on:disconnect={handleDisconnect} />
{/if}
