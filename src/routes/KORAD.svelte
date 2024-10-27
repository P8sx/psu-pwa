<script lang="ts">
    export let port:any;

    import { createEventDispatcher } from 'svelte';
    import { Semaphore } from '../lib/semaphore';
    import { Button, Row, Col, Label, Input, Icon, ButtonGroup, InputGroup, InputGroupText, colorMode, useColorMode, Tooltip, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Collapse} from '@sveltestrap/sveltestrap';
    import LineChart from '../components/LineChart.svelte';
    import ProgrammableTable from '../components/ProgrammableTable.svelte'
    
    let chart:LineChart;

    const dispatch = createEventDispatcher();
    const serialSemaphore = new Semaphore(1);

    const quick_voltages = [3.3, 5, 12, 24, 30]
    const quick_currents = [0.1, 0.5, 1, 3, 5]

    const korad_type: { [key: string]: [number, number] } = {
      "3003":[30,3],
      "3005":[30,5],
      "3010":[30,10],
      "6002":[60,2],
      "6003":[60,3],
      "6005":[60,5],
    }
    let writer:any;
    let reader:any;

    let v_max:number = 30
    let i_max:number = 5

    let v_out:number = 0.0
    let v_set:number = 0.0
    let v_requested:number = 0.0
    let v_input:number = 0.0

    let i_out:number = 0.0
    let i_set:number = 0.0
    let i_requested:number = 0.0
    let i_input:number = 0.0

    let output_status:boolean = false

    let ovp_mode_status:boolean = false
    let ocp_mode_status:boolean = false

    let cc_cv_mode: boolean = false // false - CC, true - CV

    let memory_save: boolean = false // false - memory, true - save
    
    function sleep(milliseconds:any) {
      return new Promise(resolve => {
          setTimeout(resolve, milliseconds);
      });
    }

    async function serialReadUntil(message:string, numberOfBytes:number) {
      if (port && writer && reader) {
        let response:string = ""

        await serialSemaphore.acquire();
        await writer.write(new TextEncoder().encode(message));

        let offset = 0;
        while (offset < numberOfBytes) {
          const { value, done } = await reader.read();
          if (done) {
            reader.releaseLock();
            break;
          }
          response += new TextDecoder('ascii').decode(value.buffer);
          offset += value.byteLength
        }

        serialSemaphore.release();
        return response;
      }
      return ""
    }
    async function serialReadLine(message:string) {
      if (port && writer && reader) {
        let response:string = ""

        await serialSemaphore.acquire();
        await writer.write(new TextEncoder().encode(message));

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            reader.releaseLock();
            break;
          }
          response += new TextDecoder('ascii').decode(value.buffer);

          if (message.includes('\n')) {
            const cleanMessage = response.trim();
            serialSemaphore.release();
            return response;
          }
        }
        serialSemaphore.release();
        return response;
      }
      return ""
    }

    async function serialWrite(message:string) {
      if (port && writer) {
        await serialSemaphore.acquire();
        await writer.write(new TextEncoder().encode(message));
        serialSemaphore.release();
      }
    }
  

    async function loopSerial() {
      try{
        let start = Date.now()/1000
        if (port) {
          writer = port.writable.getWriter();
          reader = port.readable.getReader();

          const idn = await serialReadLine('*IDN?\n');
          const typeFound = Object.keys(korad_type).find(type => idn.includes(type));

          if (typeFound){
            console.log("Found KORAD:",typeFound)
            v_max = korad_type[typeFound][0];
            i_max = korad_type[typeFound][1];
          }
          else{
            console.log("No KORAD id found setting default 30V/5A")
          }

          v_requested = v_input = Number(await serialReadUntil('VSET1?\n', 6));
          i_requested = i_input = Number(await serialReadUntil('ISET1?\n', 6));
          
          while (true && port) {
            v_set = Number(await serialReadUntil('VSET1?\n', 6));
            i_set = Number(await serialReadUntil('ISET1?\n', 6));

            for (let i = 0; i < 5; i++) {
              v_out = Number(await serialReadUntil('VOUT1?\n', 6));
              i_out = Number(await serialReadUntil('IOUT1?\n', 6));
            }
            const status = await serialReadUntil('STATUS?\n', 1);
            const statusByte = new Uint8Array([status.charCodeAt(0)]) ;
            output_status = (statusByte[0] & 0x40) !== 0;
            ovp_mode_status = (statusByte[0] & 0x80) !== 0;
            ocp_mode_status = (statusByte[0] & 0x20) !== 0;
            cc_cv_mode = (statusByte[0] & 0x01) !== 0;

            await sleep(5);
            
            chart.updateData((Date.now()/1000 - start).toFixed(2), v_out, i_out)
          }
        }
      }
      catch(error){
        console.log(error)
        disconnect()
      }
    }
  
    loopSerial();

    async function disconnect() {
      console.log("disconnect")
      writer.releaseLock();
      try {
        reader.releaseLock();
      } catch (error) {
        console.log(error)
      }
      serialSemaphore.release();
      dispatch('disconnect');
    }

    function setPSU(state: boolean){
      if(state){
        serialWrite('OUT1\n')
      }
      else{
        serialWrite('OUT0\n')
      }
    }

    function setOCP(state: boolean){
      if(state){
        serialWrite('OCP1\n')
      }
      else{
        serialWrite('OCP0\n')
      }
    }

    function setOVP(state: boolean){
      if(state){
        serialWrite('OVP1\n')
      }
      else{
        serialWrite('OVP0\n')
      }
    }

    function setVoltage(voltage:number){
      if(voltage <= v_max){
          serialWrite('VSET1:'+parseFloat(voltage).toFixed(2)+'\n')
      }
    }


    function setCurrent(current:number){
      if(current <= i_max){
        serialWrite('ISET1:'+parseFloat(current).toFixed(3)+'\n')
      }
    }

    function memoryRecall(id:number){
      serialWrite('RCL'+id.toString()+'\n')
    }
    
    function memorySave(id:number){
      serialWrite('SAV'+id.toString()+'\n')
    }

    function cycleOutput(event){
      const {id, voltage, current} = event.detail
      if(id == 0){
        setPSU(false);
        return;
      }
      if(id == 1){
        setPSU(true);
      }
      setVoltage(voltage);
      setCurrent(current);
    }

    $: if(v_requested){
      setVoltage(v_requested)
    }
    $: if(i_requested){
      setCurrent(i_requested)
    }
    
  </script>


<div class="container mt-4 px-4">
  <Row class="p-0 mt-2">
    <div style="width: fit-content;" class="p-0 " >
      <Button id="disconnect" color="danger"  on:click={() => disconnect()}>
        Disconnect <Icon name="power" />
      </Button>
      <Tooltip target="disconnect" placement="right">Disconnect from PSU</Tooltip>
    </div>


    <div style="width: fit-content;" class="p-0 ms-auto">
      <ButtonGroup>
        <Button id="light" color="primary" outline active={$colorMode === 'light'} on:click={() => useColorMode('light')}>
          <Icon name="sun-fill" />
        </Button>
        <Tooltip target="light" placement="bottom">Light Mode</Tooltip>
        <Button id="dark" color="primary" outline active={$colorMode === 'dark'} on:click={() => useColorMode('dark')}>
          <Icon name="moon-stars-fill" />
        </Button>
        <Tooltip target="dark" placement="bottom">Dark Mode</Tooltip>
        <Button id="auto" color="primary" outline active={$colorMode === 'auto'} on:click={() => useColorMode('auto')}>
          <Icon name="circle-half" />
        </Button>
        <Tooltip target="auto" placement="bottom">Auto Mode</Tooltip>
      </ButtonGroup>
    </div>
  </Row>

  <Row class="border border-primary rounded mt-2" style="max-height:300px">
    <LineChart bind:this={chart} id="vi_chart" xLabel="Time (s)" yLabel="Voltage (V)" yMin={0} yMax={v_max + 1} yMin1={0} yMax1={i_max + 0.1} />
  </Row>

  <Row class="p-0 mt-2">
    <Col class="border border-primary rounded me-1">
      <p class="mb-0">Target Voltage (V)</p>
      <p class="display-1 text-center mt-0"><strong>{v_set < 10 ? `0${v_set.toFixed(2)}` : v_set.toFixed(2)}</strong></p>
    </Col>
    <Col class="border border-primary rounded ms-1">
      <p class="mb-0">Target Current (A)</p>
      <p class="display-1 text-center mt-0"><strong>{i_set.toFixed(3)}</strong></p>
    </Col>
  </Row>

  <Row class="p-0 mt-2">
    <Col class="border border-primary rounded me-1">
      <p class="mb-0">Actual Voltage (V)</p>
      <p class="display-1 text-center mt-0"><strong>{v_out < 10 ? `0${v_out.toFixed(2)}` : v_out.toFixed(2)}</strong></p>
    </Col>
    <div class="col border border-primary rounded ms-1" class:bg-danger={!cc_cv_mode && output_status}>
      <p class="mb-0">Actual Current (A)</p>
      <p class="display-1 text-center mt-0"><strong>{i_out.toFixed(3)}</strong></p>
    </div>
  </Row>

  <Row class="p-0 mt-2">
    <Col class="me-1 px-0" >
      <Row class="justify-content-end">
        <Col>
          <p class="mb-0">Voltage</p>
        </Col>
        <Col xs="auto">
          <Input type="switch" label="OVP" checked={ovp_mode_status} on:change={()=> setOVP(!ovp_mode_status)}/>
        </Col>
      </Row>

      <InputGroup size="lg">
        <Button color="primary" on:click={()=>(v_requested = v_input = parseFloat(Number(v_requested - 0.10).toFixed(2)))}>-</Button>
        <Input type="number" step="0.01" lang="en" min="0.00" max={v_max} bind:value={v_input} id="v_input" style="text-align: center;" on:blur={() => {v_requested = v_input}} on:keydown={(event)=>{if(event.key === 'Enter') v_requested = v_input}}/>
        <Button color="primary" on:click={()=>(v_requested = v_input = parseFloat(Number(v_requested + 0.10).toFixed(2)))}>+</Button>
      </InputGroup>


      <Dropdown>
        <ButtonGroup class="mt-1" sm style="width:100%;">
          {#each quick_voltages as voltage}
          <Button class="px-0" color="primary" outline on:click={()=>{setPSU(false); v_requested = v_input = voltage}} >{voltage}V</Button>
          {/each}
        <DropdownToggle class="px-1" caret>MEM</DropdownToggle>
      </ButtonGroup>
      <DropdownMenu end>
          <DropdownItem header>
            <Input type="switch" label="Save" bind:value={memory_save} on:change={()=>{memory_save = !memory_save}}/>
          </DropdownItem>
          {#if !memory_save}
            {#each {length: 5} as _, i}
            <DropdownItem  on:click={()=> memoryRecall(i+1)}>M{i+1}</DropdownItem>
            {/each}
          {:else}
            {#each {length: 5} as _, i}
            <DropdownItem  on:click={()=> memorySave(i+1)}>SAV-M{i+1}</DropdownItem>
            {/each}
          {/if}
        </DropdownMenu>
      </Dropdown>

    </Col>

    <Col class="ms-1 px-0">
      <Row class="justify-content-end">
        <Col>
          <p class="mb-0">Current</p>
        </Col>
        <Col xs="auto">
          <Input type="switch" label="OCP" checked={ocp_mode_status} on:change={()=> setOCP(!ocp_mode_status)}/>
        </Col>
      </Row>
      <InputGroup size="lg">
        <Button color="primary" on:click={()=>(i_requested = i_input = parseFloat(Number(i_requested - 0.10).toFixed(2)))}>-</Button>
        <Input type="number" step="0.001" lang="en" min="0.00" max={i_max} bind:value={i_input} id="i_input" style="text-align: center;" on:blur={() => {i_requested = i_input}} on:keydown={(event)=>{if(event.key === 'Enter') i_requested = i_input}}/>
        <Button color="primary" on:click={()=>(i_requested = i_input = parseFloat(Number(i_requested + 0.10).toFixed(2)))}>+</Button>
      </InputGroup>

      <ButtonGroup class="mt-1" sm style="width:100%;">
        {#each quick_currents as current}
        <Button class="px-0" color="primary" outline on:click={()=>{i_requested = i_input = current}}>{current}A</Button>
        {/each}
      </ButtonGroup>
    </Col>
  </Row>

  <Row class="p-0 mt-2">
    <Col class="px-0 ">
      <Button size="lg" style="width: 100%; min-height: 60px" color={(output_status ? 'success' : 'danger')} on:click={()=> setPSU(!output_status)}>
        <Icon name="i" />
        <span>{output_status ? 'ON' : 'OFF'}</span>
      </Button>
    </Col>
  </Row>



  <ProgrammableTable on:callSetOutput={cycleOutput}/>
</div>

  
<style>
</style>
