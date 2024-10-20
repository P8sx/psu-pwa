<script>
  import { createEventDispatcher } from 'svelte';
  import { Button, Icon, Input } from '@sveltestrap/sveltestrap';
  
  function connect() {
      dispatch('connect');
    }
  
  const dispatch = createEventDispatcher();
  let dupa = 5;

</script>

<style>
  .centered-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

</style>

<div class="centered-container">
  <p>Connect to KORAD power supply</p>
  <Button color="primary" on:click={connect}>
    <Icon name="gear-wide-connected" />
    <span>Connect</span>
  </Button>

</div>
