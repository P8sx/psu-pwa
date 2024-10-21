<script lang="ts">
    export let port:any;

    import { createEventDispatcher } from 'svelte';
    import { Semaphore } from '../lib/semaphore';
    import { Button, Row, Col, Label, Input, Icon } from '@sveltestrap/sveltestrap';

    const dispatch = createEventDispatcher();
    const serialSemaphore = new Semaphore(1);

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
    let i_out:number = 0.0
    let v_set:number = 0.0
    let i_set:number = 0.0
    
    let v_requested:number = 0
    let i_requested:number = 0

    let output_status:boolean = false
    let ovp_mode_status:boolean = false
    let ocp_mode_status:boolean = false
    let cc_cv_mode: boolean = false // false - CC, true - CV

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

            await sleep(20);
            
            v_chart.updateData((Date.now()/1000 - start).toFixed(2), v_out)
            i_chart.updateData((Date.now()/1000 - start).toFixed(2), i_out)
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

    import LineChart from '../components/LineChart.svelte';
    let v_chart:LineChart;
    let i_chart:LineChart;

    function togglePSU(){
      if(output_status){
        serialWrite('OUT0\n')
      }
      else{
        serialWrite('OUT1\n')
      }
    }
    function toggleOCP(){
      if(ocp_mode_status){
        serialWrite('OCP0\n')
      }
      else{
        serialWrite('OCP1\n')
      }
    }
    function toggleOVP(){
      if(ovp_mode_status){
        serialWrite('OVP0\n')
      }
      else{
        serialWrite('OVP1\n')
      }
    }

    function setVoltage(event:any){
      if(event instanceof PointerEvent || event instanceof KeyboardEvent && event.key === 'Enter'){
        if(v_requested <= v_max){
          serialWrite('VSET1:'+parseFloat(v_requested).toFixed(2)+'\n')
        }
      }
    }
    function setCurrent(event:any){
      if(event instanceof PointerEvent || event instanceof KeyboardEvent && event.key === 'Enter'){
        if(i_requested <= i_max){
          serialWrite('ISET1:'+parseFloat(i_requested).toFixed(3)+'\n')
        }
      }

    }
    function memoryRecall(id:number){
      serialWrite('RCL'+id.toString()+'\n')
    }
    function memorySave(id:number){
      serialWrite('SAV'+id.toString()+'\n')
    }
  </script>


<div class="container mt-4">
    <Row class="justify-content-md-center">

      <Col class="col-5">
        <Row class="mb-3 align-items-center">
          <Col xs="auto">
            <Label for="v_input" class="mb-0">VSET: <b>{v_set}V</b></Label>
          </Col>
          <Col>
            <Input type="number" step="0.01" lang="en" min="0.00" max="31.00" on:keydown={setVoltage} bind:value={v_requested} id="v_input" placeholder={v_set.toString()+'V'} style="text-align: right;"/>
          </Col>
          <Col xs="auto">
            <Button color="success" on:click={setVoltage}>Set</Button>
          </Col>
        </Row>
          <LineChart bind:this={v_chart} id="v_chart" xLabel="Time (s)" yLabel="Voltage (V)" yMin={0} yMax={v_max + 1} />
      </Col>


      <Col class="col-5">
        <Row class="mb-3 align-items-center">
          <Col xs="auto">
            <Label for="i_input" class="mb-0">ISET: <b>{i_set}A</b></Label>
          </Col>
          <Col>
            <Input type="number" step="0.001" lang="en" on:keydown={setCurrent} bind:value={i_requested} id="i_input" placeholder={i_set.toString()+'A'} style="text-align: right;"/>
          </Col>
          <Col xs="auto">
            <Button color="success" on:click={setCurrent}>Set</Button>
          </Col>
        </Row>
          <LineChart bind:this={i_chart} id="i_chart" xLabel="Time (s)" yLabel="Current (A)" yMin={0} yMax={i_max + 0.2} />
      </Col>


      <Col class="col-2">
        <Row class="mb-2">
          <Button style="width: 100%;" color={(output_status ? 'success' : 'danger')} on:click={()=> togglePSU()}>
            <Icon name="power" />
            <span>{output_status ? 'ON' : 'OFF'}</span>
          </Button>
        </Row>

        <Row class="text-center">
          <Col>
            <span>Voltage:</span>          
          </Col>
          <Col>
            <span>{v_out} V</span>         
          </Col>
        </Row>   
  
        <Row class="text-center">
          <Col>
            <span>Current:</span>          
          </Col>
          <Col>
            <span>{i_out} A</span>         
          </Col>
        </Row>  

        <Row class="text-center">
          <Col>
            <span>Power:</span>          
          </Col>
          <Col>
            <span>{Math.round(v_out*i_out * 100) / 100} W</span>         
          </Col>
        </Row>  


        <Row class="text-center mb-2">
          <span>Mode:</span>
        </Row>

        <Row class="mb-2">
          <Col>
            <Button class={cc_cv_mode?"btn-success":"btn-outline-success"} style="width: 100%;" disabled >
              <span>CV</span>
            </Button>           
          </Col>
          <Col>
            <Button class={cc_cv_mode?"btn-outline-danger":"btn-danger"}  style="width: 100%;" disabled>
              <span>CC</span>
            </Button>           
          </Col>
        </Row>

        <Row class="text-center mb-2">
          <span>Options</span>
        </Row>

        <Row class="mb-2">
          <Button style="width: 100%;" color={(ocp_mode_status ? 'success' : 'danger')} on:click={()=> toggleOCP()}>
            <Icon name="v" />
            <span>{ocp_mode_status ? 'OCP - Enabled' : 'OCP - Disabled'}</span>
          </Button>
        </Row>
        <Row>
          <Button style="width: 100%;" color={(ovp_mode_status ? 'success' : 'danger')} on:click={()=> toggleOVP()}>
            <Icon name="i" />
            <span>{ovp_mode_status ? 'OVP - Enabled' : 'OVP - Disabled'}</span>
          </Button>
        </Row>

        <Row class="text-center mb-2">
          <span>Memory:</span>
        </Row>

        {#each {length: 5} as _, i}
        <Row class="mb-2">
          <Col>
            <Button class="btn-success" style="width: 100%;" on:click={()=>memoryRecall(i+1)} >
              <span>M{i+1}</span>
            </Button>           
          </Col>
          <Col>
            <Button class="btn-warning" style="width: 100%;" on:click={()=>memorySave(i+1)} >
              <span>Save</span>
            </Button>           
          </Col>
        </Row>
        {/each}
      </Col>




    </Row>
</div>

  
<style>
</style>
