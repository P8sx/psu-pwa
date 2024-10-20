<script lang="ts">
    export let port:any;
    import { createEventDispatcher } from 'svelte';
    import { Semaphore } from './../lib/semaphore';
    import { Button, Form, Row, Col, Label, Input, Icon } from '@sveltestrap/sveltestrap';
    const dispatch = createEventDispatcher();
    const serialSemaphore = new Semaphore(1);
    
    let writer:any;
    let reader:any;

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

    async function sendDataWithResponse(message:string, responseLength:number) {
      if (port && writer && reader) {
        let response:string = ""

        await serialSemaphore.acquire();
        await writer.write(new TextEncoder().encode(message));

        let offset = 0;
        while (offset < responseLength) {
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
  
    async function sendData(message:string) {
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
          console.log(port)
          while (true && port) {
            v_set = Number(await sendDataWithResponse('VSET1?\n', 6));
            i_set = Number(await sendDataWithResponse('ISET1?\n', 6));
            for (let i = 0; i < 5; i++) {
              v_out = Number(await sendDataWithResponse('VOUT1?\n', 6));
              i_out = Number(await sendDataWithResponse('IOUT1?\n', 6));
            }
            const status = await sendDataWithResponse('STATUS?\n', 1);
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
        sendData('OUT0\n')
      }
      else{
        sendData('OUT1\n')
      }
    }
    function toggleOCP(){
      if(ocp_mode_status){
        sendData('OCP0\n')
      }
      else{
        sendData('OCP1\n')
      }
    }
    function toggleOVP(){
      if(ovp_mode_status){
        sendData('OVP0\n')
      }
      else{
        sendData('OVP1\n')
      }
    }
    function setVoltage(event:any){
      console.log("test")
      if(event instanceof PointerEvent || event instanceof KeyboardEvent && event.key === 'Enter'){
        if(v_requested <= 31){
          sendData('VSET1:'+parseFloat(v_requested).toFixed(2)+'\n')
        }
      }
    }
    function setCurrent(event:any){
      console.log("test")
      if(event instanceof PointerEvent || event instanceof KeyboardEvent && event.key === 'Enter'){
        if(i_requested <= 5.1){
          sendData('ISET1:'+parseFloat(i_requested).toFixed(3)+'\n')
        }
      }

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
          <LineChart bind:this={v_chart} id="v_chart" xLabel="Time (s)" yLabel="Voltage (V)" yMin={0} yMax={31} />
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
          <LineChart bind:this={i_chart} id="i_chart" xLabel="Time (s)" yLabel="Current (A)" yMin={0} yMax={5.2} />
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

        <Row class="text-center">
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
      </Col>
    </Row>
</div>

  
<style>
</style>


    
<!-- <p>Connected to serial port.Vout:{v_out} Iout:{i_out} .Vset:{v_set} Iset:{i_set},</p>
<p>output: {output_status}, 
  ovp_mode_status: {ovp_mode_status}, 
  ocp_mode_status: {ocp_mode_status}, 
  cc_cv_mode: {cc_cv_mode}</p>

<button on:click={() => sendData('OUT0\n') }>
  Send Hello
</button>
<button on:click={() => sendData('OUT1\n')}>
  Send Test
</button>

<button on:click={disconnect}>
  Disconnect
</button> -->