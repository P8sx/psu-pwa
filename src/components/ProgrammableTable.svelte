<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Button, Input, Icon, Table, Col, Row, Progress, Collapse} from '@sveltestrap/sveltestrap';
    import { dndzone } from 'svelte-dnd-action';
    import {flip} from "svelte/animate";
    
    const dispatch = createEventDispatcher();
    const flipDurationMs = 0;

        
    export let v_max = 31
    export let i_max = 5

    type Item = {
      id: number;
      target_v: number;
      target_c: number;
      period: number;
    }

    let totalTime:number = 0
    let items: Item[] = [];
    let currentCycle: number = 0
    let currentCycleTimeStart: number = 0
    let currentCycleTimeLeft: number = 0
    let cycleStatus: boolean = false;

    let timerID:number;

    function updateIds() {
        items = items.map((item, index) => ({
            ...item,
            id: index + 1
        }));
    }

    function handleDndConsider(e:CustomEvent) {
      items = e.detail.items;
    }

    function handleDndFinalize(e:CustomEvent) {
        items = e.detail.items;
        updateIds();
    }
    
    function removeItem(item:Item){
      const index = items.indexOf(item);
      if (index > -1) {
        items.splice(index, 1);
      }
      updateIds();
    }

    function duplicateItem(item:Item){
      const index = items.indexOf(item);
      if (index > -1) {
        items.splice(index, 0, item)
      }
      updateIds();
    }

    function addNewItem(){
      let newItem:Item = {} as Item;
      newItem.id = items.length + 1;
      newItem.target_v = 0;
      newItem.target_c = 0;
      newItem.period = 1;
      items.push(newItem);
      updateIds();
    }
    
    setInterval(function() {
      if(cycleStatus){
        currentCycleTimeLeft = Date.now() - currentCycleTimeStart;
      }
    }, 50);

    $: if(items){
      totalTime = 0
      items.forEach(element => {
        totalTime +=+ element.period
      });
      console.log(totalTime)
    }

    function setOutput(step: Item){
      console.log(step)
      dispatch('callSetOutput', { id: step.id, voltage: step.target_v, current: step.target_c });
    }

    function cycle(start:boolean){
      if(start && items.length > 0){
        nextCycle(0);
        cycleStatus = true;
      }
      else{
        clearTimeout(timerID);
        setOutput({id: 0, target_v: 0, target_c: 0, period: 0});
        cycleStatus = false;
      }
    }
    
    function nextCycle(stepIndex: number){
      if(stepIndex < items.length){
        currentCycleTimeStart = Date.now()
        currentCycle = stepIndex
        setOutput(items[stepIndex]);
        timerID = setTimeout(nextCycle, items[stepIndex].period * 1000, stepIndex+1)
      }
      else{
        cycleStatus = false;
        setOutput({id: 0, target_v: 0, target_c: 0, period: 0});
      }
    }
    let isOpen:boolean = false;

  </script>


<Row class="justify-content-end mt-2">
  <Col class="px-0">
    <p class="mb-0 display-6">Programmable output</p>
  </Col>
  <Col class="pe-0" xs="auto">
    <Button size="lg" style="height:100%; width:fit-content" color="primary" on:click={() => (isOpen = !isOpen)}>
      <Icon name="{isOpen?"arrow-bar-up":"arrow-bar-down"}" />
    </Button>
  </Col>
</Row>

<Row class="p-0 mt-2">
  <Collapse {isOpen} class="px-0">
    <Col class="border border-primary rounded me-1">
      <div class="d-flex justify-content-end align-items-center my-2" >
        <Progress class="mx-3" style="width:100%; height: 2rem;" multi>
          {#each items as item, index}
            <Progress animated={currentCycle + 1 > index && cycleStatus} color="{item.id % 2 == 0 ? 'secondary' : 'primary'}" bar value={Number(item.period * 1000).toFixed(0)} max={Number(totalTime * 1000).toFixed(0)}>
              {#if currentCycle == index && cycleStatus}
                {Number(item.period - currentCycleTimeLeft / 1000).toFixed(2)}s
              {:else}
                {item.period}s
              {/if}
            </Progress>
          {/each}
        </Progress>
        <Button class="me-2" color={cycleStatus?"danger":"success"} style="width:fit-content" on:click={()=>{cycle(!cycleStatus)}}>{cycleStatus?"STOP":"Start"}</Button>
      </div>
      
      <Table>
        <thead>
          <tr>
            <th>No.</th>
            <th>Target Voltage (V)</th>
            <th>Target Current (A)</th>
            <th>Perioid (s)</th>
            <th style="width: 8rem;">
              <div class="d-flex justify-content-between align-items-center">
                <span>Control</span>
                <Button color="success" on:click={()=>addNewItem()}>
                  <Icon name="plus" />
                </Button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody use:dndzone="{{items, flipDurationMs}}" on:consider="{handleDndConsider}" on:finalize="{handleDndFinalize}">
          {#each items as item(item.id)}
            <tr animate:flip="{{duration: flipDurationMs}}">
              <th scope="row">{item.id}</th>
              <th>
                <Input type="number" step="0.01" lang="en" min="0.00" max={v_max} bind:value={item.target_v}/>
              </th>
              <th>
                <Input type="number" step="0.001" lang="en" min="0.00" max={i_max} bind:value={item.target_c}/>
              </th>
              <th>
                <Input type="number" step={0.01} lang="en" min={0} bind:value={item.period} placeholder="Time (ex. 2.230 => 2230 ms) " />
              </th>
              <th>
                <div class="d-flex justify-content-end">
                  <Button color="warning" on:click={()=>duplicateItem(item)} class="me-2">
                    <Icon name="copy" />
                  </Button>
                  <Button color="danger" on:click={()=>removeItem(item)}>
                    <Icon name="dash" />
                  </Button>
                </div>
              </th>
            </tr>
          {/each}
        </tbody>
      </Table>
    </Col>
  </Collapse>
</Row>
<style>

</style>
  