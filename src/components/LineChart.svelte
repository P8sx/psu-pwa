<script>
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';
  
    Chart.register(...registerables);
  
    export let id;
    export let xLabel = 'Indeks';
    export let yLabel = 'Napięcie (V)';
    export let yMin = 0;
    export let yMax = 100;
    
    export let options = {
      responsive: true,
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
  
    export function updateData(time, newData) {
        chartData.labels.push(time); 
        chartData.datasets[0].data.push(newData);
    
      
        if(time - chartData.labels[0] > 30){
          chartData.labels.shift()
          chartData.datasets[0].data.shift();
        }
        chart.update('none');
    }
  </script>
  
  <canvas id={id} width="400" height="400"></canvas>
  
  <style>
    canvas {
      max-width: 100%;
    }
  </style>
  