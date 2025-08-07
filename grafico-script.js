const urlParams = new URLSearchParams(window.location.search);
const salario = parseFloat(urlParams.get("salario")) || 0;
const gastos = parseFloat(urlParams.get("gastos")) || 0;
const restante = Math.max(salario - gastos, 0);
const percentual = salario ? ((gastos / salario) * 100).toFixed(2) : 0;

let corGastos = "#4caf50"; // Verde padrão
if (percentual >= 80) corGastos = "#f44336"; // Vermelho
else if (percentual >= 50) corGastos = "#ff9800"; // Amarelo

const ctx = document.getElementById("graficoSalario").getContext("2d");
new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["💸 Gastos", "💼 Salário Livre"],
    datasets: [{
      data: [gastos, restante],
      backgroundColor: [corGastos, "#8bc34a"]
    }]
  },
  options: {
    plugins: {
      legend: { position: "bottom" },
      title: {
        display: true,
        text: `💰 ${percentual}% do salário comprometido (${gastos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de ${salario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
      }
    }
  }
});
