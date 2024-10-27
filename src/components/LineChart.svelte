<script>
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';
  
    Chart.register(...registerables);
  
    export let id;
    export let xLabel = 'Index';
    export let yLabel = 'Voltage (V)';
    export let yLabel1 = 'Current (A)';
    export let yMin = 0;
    export let yMax = 100;
    export let yMin1 = 0;
    export let yMax1 = 5.1;
    let options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: xLabel
          },
          type: 'linear',
        },
        y: {
          title: {
            display: true,
            text: yLabel
          },
          min: yMin,
          max: yMax
        },
        y1: {
          title: {
            display: true,
            text: yLabel1
          },
          position: 'right',
          min: yMin1,
          max: yMax1
        }
      }
    };
  
    let chart;
    const MAX_DATA_POINTS = 100;
  
    let chartData = {
      labels: [],
      datasets: [{
        label: yLabel,
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      },
      {
        label: yLabel1,
        data: [],
        borderColor: 'rgba(192, 75, 192, 1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      }]
    };
  
    onMount(() => {
      const ctx = document.getElementById(id).getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options
      });
    });
  
    export function updateData(time, voltage, current) {
        chartData.labels.push(time); 
        chartData.datasets[0].data.push(voltage);
        chartData.datasets[1].data.push(current);
    
        if(time - chartData.labels[0] > 30){
          chartData.labels.shift()
          chartData.datasets[0].data.shift();
          chartData.datasets[1].data.shift();
        }
        chart.update('none');
    }
    window.addEventListener('afterprint', () => {
      id.resize();
    });

  </script>

  <canvas class="chart-container"  id={id}></canvas>
  
  <style>
.chart-container {
  position:relative;
  min-height:auto;
  width:100%;
  display: flex;
  flex-grow:1;
}
  </style>
  