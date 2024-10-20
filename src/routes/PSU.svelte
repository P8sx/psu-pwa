<script lang="ts">
    export let port:any;
    import { createEventDispatcher } from 'svelte';
    import { Semaphore } from './../lib/semaphore';

    const dispatch = createEventDispatcher();
    const serialSemaphore = new Semaphore(1);
    
    let writer:any;
    let reader:any;

    let v_out:number = 0.0
    let i_out:number = 0.0
    let v_set:number = 0.0
    let i_set:number = 0.0
    
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
          }
        }
      }
      catch(error){
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
  </script>
  
  <div>
    <p>Connected to serial port.Vout:{v_out} Iout:{i_out} .Vset:{v_set} Iset:{i_set},</p>
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
    </button>
  </div>
  