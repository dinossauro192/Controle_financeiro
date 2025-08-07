import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCXSzakKGK37BRGa7AoMb-XME6rC75qhqM",
  authDomain: "controle-financeiro-eaf39.firebaseapp.com",
  databaseURL: "https://controle-financeiro-eaf39-default-rtdb.firebaseio.com",
  projectId: "controle-financeiro-eaf39",
  storageBucket: "controle-financeiro-eaf39.appspot.com",
  messagingSenderId: "429418759950",
  appId: "1:429418759950:web:bd65f5d8d93b4d688af95f",
  measurementId: "G-Z6F1C0EVGG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let gastos = [];
let chartProgresso = null;
let chartGastos = null;

const formatarMoeda = valor =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);

// Elementos
const resultado = document.getElementById("resultado");
const tabelaBody = document.querySelector("#tabelaGastos tbody");
const graficoCanvas = document.getElementById("grafico").getContext("2d");
const graficoProgressoCanvas = document.getElementById("graficoProgresso").getContext("2d");

document.getElementById("btnCalcular").onclick = calcular;
document.getElementById("btnSalvar").onclick = salvarProgresso;
document.getElementById("btnAcompanhar").onclick = acompanharProgresso;
document.getElementById("btnAdicionarGasto").onclick = adicionarGasto;
document.getElementById("btnVerComprometimento").onclick = abrirGraficoComprometimento;

async function carregarGastos() {
  const q = query(collection(db, "gastos"), orderBy("data", "desc"));
  const snapshot = await getDocs(q);
  gastos = [];
  snapshot.forEach(docSnap => {
    gastos.push({ id: docSnap.id, ...docSnap.data() });
  });
  atualizarTabela();
  atualizarGrafico();
}

function atualizarTabela() {
  tabelaBody.innerHTML = "";

  gastos.forEach(gasto => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="categoria">${gasto.categoria}</td>
      <td class="valor">${formatarMoeda(gasto.valor)}</td>
      <td><button class="btn-editar">✏️</button></td>
      <td><button class="btn-remover">🗑️</button></td>
    `;

    tabelaBody.appendChild(tr);

    const btnEditar = tr.querySelector(".btn-editar");
    btnEditar.onclick = () => editarGasto(gasto.id, tr);

    const btnRemover = tr.querySelector(".btn-remover");
    btnRemover.onclick = () => removerGasto(gasto.id);
  });
}

function editarGasto(id, tr) {
  const categoriaTd = tr.querySelector(".categoria");
  const valorTd = tr.querySelector(".valor");

  const gastoAtual = gastos.find(g => g.id === id);

  categoriaTd.innerHTML = `<input type="text" value="${gastoAtual.categoria}" />`;
  valorTd.innerHTML = `<input type="number" value="${gastoAtual.valor}" />`;

  const btnEditar = tr.querySelector(".btn-editar");
  btnEditar.textContent = "💾";
  btnEditar.onclick = async () => {
    const novaCategoria = categoriaTd.querySelector("input").value.trim();
    const novoValor = parseFloat(valorTd.querySelector("input").value);

    if (!novaCategoria || isNaN(novoValor) || novoValor <= 0) {
      alert("❌ Informe categoria válida e valor maior que zero.");
      return;
    }

    const gastoDoc = doc(db, "gastos", id);
    await updateDoc(gastoDoc, { categoria: novaCategoria, valor: novoValor });

    carregarGastos();
  };
}

async function removerGasto(id) {
  if (!confirm("Tem certeza que deseja remover este gasto?")) return;

  await deleteDoc(doc(db, "gastos", id));
  carregarGastos();
}

function calcular() {
  const salario = parseFloat(document.getElementById("salario").value);
  const porcentagem = parseFloat(document.getElementById("porcentagem").value) / 100;
  const meta = parseFloat(document.getElementById("meta").value);
  const guardado = parseFloat(document.getElementById("guardado").value);

  if (isNaN(salario) || isNaN(porcentagem) || isNaN(meta) || isNaN(guardado)) {
    resultado.innerHTML = "❌ Preencha todos os campos corretamente.";
    return;
  }

  const economiaMensal = salario * porcentagem;
  const restante = meta - guardado;
  const meses = Math.ceil(restante / economiaMensal);

  resultado.innerHTML = `
    ✅ Você economiza <strong>${formatarMoeda(economiaMensal)}</strong> por mês.<br>
    ⏳ Vai atingir a meta de <strong>${formatarMoeda(meta)}</strong> em aproximadamente <strong>${meses} meses</strong>.
  `;
}

async function salvarProgresso() {
  const salario = parseFloat(document.getElementById("salario").value);
  const porcentagem = parseFloat(document.getElementById("porcentagem").value);
  const meta = parseFloat(document.getElementById("meta").value);
  const guardado = parseFloat(document.getElementById("guardado").value);

  await addDoc(collection(db, "progresso"), {
    salario,
    porcentagem,
    meta,
    guardado,
    data: new Date()
  });
  alert("✅ Progresso salvo com sucesso!");
}

function acompanharProgresso() {
  const guardado = parseFloat(document.getElementById("guardado").value);
  const meta = parseFloat(document.getElementById("meta").value);
  const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);
  const falta = Math.max(meta - guardado, 0);

  if (chartProgresso) chartProgresso.destroy();

  chartProgresso = new Chart(graficoProgressoCanvas, {
    type: "bar",
    data: {
      labels: ["Gastos Totais", "Valor Guardado", "Falta para Meta"],
      datasets: [{
        label: "R$",
        data: [totalGastos, guardado, falta],
        backgroundColor: ["#f44336", "#4caf50", "#ff9800"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "📊 Progresso Financeiro" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `R$ ${value}`
          }
        }
      }
    }
  });
}

async function adicionarGasto() {
  const categoria = document.getElementById("categoria").value.trim();
  const valor = parseFloat(document.getElementById("valorGasto").value);

  if (!categoria || isNaN(valor) || valor <= 0) {
    alert("❌ Informe uma categoria e valor válido maior que zero.");
    return;
  }

  await addDoc(collection(db, "gastos"), {
    categoria,
    valor,
    data: new Date()
  });

  document.getElementById("categoria").value = "";
  document.getElementById("valorGasto").value = "";
  carregarGastos();
}

function abrirGraficoComprometimento() {
  const salario = parseFloat(document.getElementById("salario").value) || 0;
  const totalGastos = gastos.reduce((acc, g) => acc + g.valor, 0);

  const params = new URLSearchParams();
  params.set("salario", salario);
  params.set("gastos", totalGastos);

  window.open(`grafico-salario.html?${params.toString()}`, "_blank");
}

window.onload = () => {
  carregarGastos();
  calcular();
};
