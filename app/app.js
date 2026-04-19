(function () {
  const procedures = Array.isArray(window.PROCEDURES) ? window.PROCEDURES : [];

  const elements = {
    patientName: document.querySelector("#patientName"),
    quoteDate: document.querySelector("#quoteDate"),
    validUntil: document.querySelector("#validUntil"),
    procedureSelect: document.querySelector("#procedureSelect"),
    variantSelect: document.querySelector("#variantSelect"),
    complexitySelect: document.querySelector("#complexitySelect"),
    procedureLabel: document.querySelector("#procedureLabel"),
    surgeryFee: document.querySelector("#surgeryFee"),
    anesthesiaFee: document.querySelector("#anesthesiaFee"),
    implantSection: document.querySelector("#implantSection"),
    implantToggle: document.querySelector("#implantToggle"),
    implantDescription: document.querySelector("#implantDescription"),
    implantFee: document.querySelector("#implantFee"),
    hospitalName: document.querySelector("#hospitalName"),
    hospitalFee: document.querySelector("#hospitalFee"),
    fixedExtras: document.querySelector("#fixedExtras"),
    paymentTerms: document.querySelector("#paymentTerms"),
    includedText: document.querySelector("#includedText"),
    notesText: document.querySelector("#notesText"),
    extraItems: document.querySelector("#extraItems"),
    addItemButton: document.querySelector("#addItemButton"),
    printButton: document.querySelector("#printButton"),
    grandTotal: document.querySelector("#grandTotal"),
    previewProcedure: document.querySelector("#previewProcedure"),
    previewPatientCover: document.querySelector("#previewPatientCover"),
    previewPatient: document.querySelector("#previewPatient"),
    previewDate: document.querySelector("#previewDate"),
    previewValidity: document.querySelector("#previewValidity"),
    previewProcedureText: document.querySelector("#previewProcedureText"),
    implantPreviewSection: document.querySelector("#implantPreviewSection"),
    previewImplantDescription: document.querySelector("#previewImplantDescription"),
    previewIncludedPage: document.querySelector("#previewIncludedPage"),
    previewNotesPage: document.querySelector("#previewNotesPage"),
    previewTerms: document.querySelector("#previewTerms"),
    previewTotal: document.querySelector("#previewTotal"),
    pricingBlocks: document.querySelector("#pricingBlocks"),
    implantPricingBlock: document.querySelector("#implantPricingBlock")
  };

  const storageKey = "surgical-budget-app-state-v1";
  let extraItems = [];
  let isApplyingSavedState = false;

  function toCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(value || 0));
  }

  function toDateDisplay(value) {
    if (!value) return "-";
    const [year, month, day] = value.split("-");
    return [day, month, year].join("/");
  }

  function sanitizeMultiline(text) {
    const clean = (text || "").trim();
    if (!clean) {
      return '<p class="preview-empty">Nenhuma informação adicionada.</p>';
    }
    return clean
      .split(/\n+/)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");
  }

  function sanitizeBullets(text, fallbackItems = []) {
    const clean = (text || "").trim();
    const items = clean
      ? clean.split(/\n+/).map((line) => line.trim()).filter(Boolean)
      : fallbackItems;

    if (!items.length) {
      return '<p class="preview-empty">Nenhuma informação adicionada.</p>';
    }

    return items.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function readNumber(input) {
    const value = Number(input.value);
    return Number.isFinite(value) ? value : 0;
  }

  function getSelectedProcedure() {
    return procedures[Number(elements.procedureSelect.value)] || procedures[0] || null;
  }

  function getSelectedVariant() {
    const procedure = getSelectedProcedure();
    const index = Number(elements.variantSelect.value);
    if (!procedure || !Number.isInteger(index) || index < 0) return null;
    return procedure.variants[index] || null;
  }

  function getSelectedPriceSet() {
    const record = getSelectedVariant() || getSelectedProcedure();
    const complexity = elements.complexitySelect.value;
    return record?.prices?.[complexity] || { cirurgia: 0, anestesia: 0, total: 0 };
  }

  function procedureUsesImplants() {
    const procedure = getSelectedProcedure();
    const variant = getSelectedVariant();
    const text = [procedure?.name || "", variant?.name || "", elements.procedureLabel.value || ""]
      .join(" ")
      .toLowerCase();

    const keywords = [
      "implante",
      "prótese",
      "protese",
      "mastoplastia aumento",
      "mastopexia com implantes",
      "substituição implantes",
      "retirada implantes",
      "contratura capsular"
    ];

    return keywords.some((keyword) => text.includes(keyword));
  }

  function updateImplantVisibility() {
    const show = procedureUsesImplants() || elements.implantToggle.checked;
    elements.implantSection.classList.toggle("is-hidden", !show);
    if (show && !elements.implantToggle.checked) {
      elements.implantToggle.checked = true;
    }
    if (!show) {
      elements.implantToggle.checked = false;
      elements.implantDescription.value = "";
      elements.implantFee.value = "";
    }
  }

  function fillProcedureOptions() {
    elements.procedureSelect.innerHTML = "";
    procedures.forEach((procedure, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = procedure.name;
      elements.procedureSelect.append(option);
    });
  }

  function fillVariantOptions() {
    const procedure = getSelectedProcedure();
    elements.variantSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "-1";
    defaultOption.textContent = "Sem componente adicional";
    elements.variantSelect.append(defaultOption);

    if (!procedure) return;

    procedure.variants.forEach((variant, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = variant.name;
      elements.variantSelect.append(option);
    });
  }

  function syncValuesFromSelection() {
    const priceSet = getSelectedPriceSet();
    elements.surgeryFee.value = priceSet.cirurgia ?? 0;
    elements.anesthesiaFee.value = priceSet.anestesia ?? 0;

    const procedure = getSelectedProcedure();
    const variant = getSelectedVariant();
    elements.procedureLabel.value = variant
      ? `${procedure.name} + ${variant.name}`
      : (procedure?.name || "");
    updateImplantVisibility();
  }

  function createExtraItemRow(item = { label: "", value: 0 }) {
    const row = document.createElement("div");
    row.className = "extra-item";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Descrição do item";
    nameInput.value = item.label;

    const valueInput = document.createElement("input");
    valueInput.type = "number";
    valueInput.min = "0";
    valueInput.step = "0.01";
    valueInput.placeholder = "0,00";
    valueInput.value = item.value || "";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "ghost-button";
    removeButton.textContent = "X";

    function updateState() {
      extraItems = Array.from(elements.extraItems.querySelectorAll(".extra-item")).map((currentRow) => {
        const [label, value] = currentRow.querySelectorAll("input");
        return {
          label: label.value.trim(),
          value: Number(value.value) || 0
        };
      });
      renderPreview();
      persistState();
    }

    nameInput.addEventListener("input", updateState);
    valueInput.addEventListener("input", updateState);
    removeButton.addEventListener("click", () => {
      row.remove();
      updateState();
    });

    row.append(nameInput, valueInput, removeButton);
    elements.extraItems.append(row);
  }

  function rebuildExtraItems(items) {
    elements.extraItems.innerHTML = "";
    extraItems = items.length ? items : [];
    extraItems.forEach((item) => createExtraItemRow(item));
  }

  function buildCostEntries() {
    const showImplants = elements.implantToggle.checked;
    const entries = [
      { label: "Honorários cirúrgicos", value: readNumber(elements.surgeryFee) },
      { label: "Anestesista", value: readNumber(elements.anesthesiaFee) },
      { label: "Próteses / implantes mamários", value: showImplants ? readNumber(elements.implantFee) : 0 },
      { label: "Hospital", value: readNumber(elements.hospitalFee), subtitle: elements.hospitalName.value.trim() || "Hospital" },
      { label: "Outros custos fixos", value: readNumber(elements.fixedExtras) }
    ];

    extraItems
      .filter((item) => item.label && item.value)
      .forEach((item) => entries.push({ label: item.label, value: item.value }));

    return entries.filter((entry) => entry.value > 0);
  }

  function buildIncludedItems() {
    const manualItems = (elements.includedText.value || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const automaticItems = [];
    const variant = getSelectedVariant();

    if (variant?.name) {
      automaticItems.push(`Adicional programado: ${variant.name}`);
    }

    if (elements.implantToggle.checked && readNumber(elements.implantFee) > 0) {
      automaticItems.push(
        elements.implantDescription.value.trim() || "Próteses / implantes mamários"
      );
    }

    extraItems
      .filter((item) => item.label && item.value)
      .forEach((item) => automaticItems.push(item.label));

    return [...manualItems, ...automaticItems];
  }

  function buildPricingBlock(entry) {
    if (entry.label === "Hospital") {
      const estimate = `${toCurrency(entry.value * 0.9)} - ${toCurrency(entry.value * 1.1)}`;
      return `
        <div class="pricing-block">
          <h4 class="pricing-title">${escapeHtml(entry.label)}</h4>
          <p class="pricing-subtitle">${escapeHtml(entry.subtitle || "Hospital")}</p>
          <p class="pricing-main">${estimate}</p>
          <p class="pricing-note">(estimativa de valor)</p>
          <p class="pricing-note">- à vista ou em até 2 vezes (cartão de crédito)</p>
        </div>
      `;
    }

    return `
      <div class="pricing-block">
        <h4 class="pricing-title">${escapeHtml(entry.label)}</h4>
        <p class="pricing-main">${toCurrency(entry.value)}</p>
        <p class="pricing-note">- à vista (PIX ou transferência)</p>
        <p class="pricing-note">- de 1 a 6 vezes (cartão de crédito): ${toCurrency(entry.value * 1.125)}</p>
        <p class="pricing-note">- de 7 a 12 vezes (cartão de crédito): ${toCurrency(entry.value * 1.25)}</p>
      </div>
    `;
  }

  function renderPreview() {
    const procedure = getSelectedProcedure();
    const variant = getSelectedVariant();
    const procedureText = elements.procedureLabel.value.trim() || procedure?.name || "-";
    const entries = buildCostEntries();
    const total = entries.reduce((sum, entry) => sum + entry.value, 0);
    const showImplants = elements.implantToggle.checked;
    const implantDescription = elements.implantDescription.value.trim() || "Próteses / implantes mamários conforme definição cirúrgica.";
    const defaultIncludedItems = [
      "Planejamento cirúrgico individualizado",
      "Acompanhamento próximo no pós-operatório",
      "Orientações detalhadas para recuperação",
      "Equipe e estrutura alinhadas ao procedimento proposto"
    ];
    const defaultNotesItems = [
      "Este documento foi preparado para facilitar sua decisão com clareza e organização.",
      "Os valores apresentados seguem o procedimento selecionado e podem ser ajustados pela equipe quando necessário.",
      "O acompanhamento pós-operatório faz parte do planejamento proposto."
    ];

    elements.previewProcedure.textContent = procedureText;
    elements.previewPatientCover.textContent = elements.patientName.value.trim() || "Nome Paciente";
    elements.previewPatient.textContent = elements.patientName.value.trim() || "-";
    elements.previewDate.textContent = toDateDisplay(elements.quoteDate.value);
    elements.previewValidity.textContent = toDateDisplay(elements.validUntil.value);
    elements.previewProcedureText.textContent = variant
      ? `${procedure?.name || ""} com ${variant.name.toLowerCase()}.`
      : procedureText;
    const includedItems = buildIncludedItems();
    elements.previewIncludedPage.innerHTML = sanitizeBullets(
      includedItems.join("\n"),
      defaultIncludedItems
    );
    elements.previewNotesPage.innerHTML = sanitizeBullets(elements.notesText.value, defaultNotesItems);
    elements.previewTerms.textContent = elements.paymentTerms.value.trim() || "-";
    elements.previewTotal.textContent = toCurrency(total);
    elements.grandTotal.textContent = toCurrency(total);
    elements.implantPreviewSection.classList.toggle("is-hidden", !showImplants);
    elements.previewImplantDescription.textContent = implantDescription;
    elements.pricingBlocks.innerHTML = entries.length
      ? entries.map(buildPricingBlock).join("")
      : '<p class="preview-empty">Nenhum valor informado.</p>';
    elements.implantPricingBlock.innerHTML = showImplants
      ? buildPricingBlock({
          label: "Próteses / implantes mamários",
          value: readNumber(elements.implantFee)
        })
      : "";
  }

  function collectState() {
    return {
      patientName: elements.patientName.value,
      quoteDate: elements.quoteDate.value,
      validUntil: elements.validUntil.value,
      procedureIndex: elements.procedureSelect.value,
      variantIndex: elements.variantSelect.value,
      complexity: elements.complexitySelect.value,
      procedureLabel: elements.procedureLabel.value,
      surgeryFee: elements.surgeryFee.value,
      anesthesiaFee: elements.anesthesiaFee.value,
      implantToggle: elements.implantToggle.checked,
      implantDescription: elements.implantDescription.value,
      implantFee: elements.implantFee.value,
      hospitalName: elements.hospitalName.value,
      hospitalFee: elements.hospitalFee.value,
      fixedExtras: elements.fixedExtras.value,
      paymentTerms: elements.paymentTerms.value,
      includedText: elements.includedText.value,
      notesText: elements.notesText.value,
      extraItems
    };
  }

  function persistState() {
    if (isApplyingSavedState) return;
    localStorage.setItem(storageKey, JSON.stringify(collectState()));
  }

  function applyState(state) {
    if (!state) return;
    isApplyingSavedState = true;

    elements.patientName.value = state.patientName || "";
    elements.quoteDate.value = state.quoteDate || "";
    elements.validUntil.value = state.validUntil || "";
    elements.procedureSelect.value = state.procedureIndex || "0";
    fillVariantOptions();
    elements.variantSelect.value = state.variantIndex || "-1";
    elements.complexitySelect.value = state.complexity || "A";
    syncValuesFromSelection();

    elements.procedureLabel.value = state.procedureLabel || elements.procedureLabel.value;
    elements.surgeryFee.value = state.surgeryFee || elements.surgeryFee.value;
    elements.anesthesiaFee.value = state.anesthesiaFee || elements.anesthesiaFee.value;
    elements.implantToggle.checked = Boolean(state.implantToggle);
    elements.implantDescription.value = state.implantDescription || "";
    elements.implantFee.value = state.implantFee || "";
    elements.hospitalName.value = state.hospitalName || "Hospital Accurate";
    elements.hospitalFee.value = state.hospitalFee || "";
    elements.fixedExtras.value = state.fixedExtras || "";
    elements.paymentTerms.value = state.paymentTerms || "";
    elements.includedText.value = state.includedText || "";
    elements.notesText.value = state.notesText || "";
    rebuildExtraItems(Array.isArray(state.extraItems) ? state.extraItems : []);

    isApplyingSavedState = false;
    renderPreview();
  }

  function loadSavedState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "null");
    } catch {
      return null;
    }
  }

  function setDefaultDates() {
    const now = new Date();
    const quote = now.toISOString().slice(0, 10);
    const validity = new Date(now);
    validity.setDate(validity.getDate() + 15);
    elements.quoteDate.value = quote;
    elements.validUntil.value = validity.toISOString().slice(0, 10);
  }

  function bindEvents() {
    elements.procedureSelect.addEventListener("change", () => {
      fillVariantOptions();
      elements.variantSelect.value = "-1";
      syncValuesFromSelection();
      renderPreview();
      persistState();
    });

    elements.variantSelect.addEventListener("change", () => {
      syncValuesFromSelection();
      renderPreview();
      persistState();
    });

    elements.complexitySelect.addEventListener("change", () => {
      syncValuesFromSelection();
      renderPreview();
      persistState();
    });

    [
      elements.patientName,
      elements.quoteDate,
      elements.validUntil,
      elements.procedureLabel,
      elements.surgeryFee,
      elements.anesthesiaFee,
      elements.implantToggle,
      elements.implantDescription,
      elements.implantFee,
      elements.hospitalName,
      elements.hospitalFee,
      elements.fixedExtras,
      elements.paymentTerms,
      elements.includedText,
      elements.notesText
    ].forEach((field) => {
      field.addEventListener(field === elements.implantToggle ? "change" : "input", () => {
        if (field === elements.procedureLabel) {
          updateImplantVisibility();
        }
        if (field === elements.implantToggle) {
          updateImplantVisibility();
        }
        renderPreview();
        persistState();
      });
    });

    elements.addItemButton.addEventListener("click", () => {
      createExtraItemRow();
      extraItems = [...extraItems, { label: "", value: 0 }];
    });

    elements.printButton.addEventListener("click", () => window.print());
  }

  function init() {
    fillProcedureOptions();
    fillVariantOptions();
    setDefaultDates();
    elements.hospitalName.value = "Hospital Accurate";
    syncValuesFromSelection();
    bindEvents();
    applyState(loadSavedState());
    updateImplantVisibility();
    renderPreview();
  }

  init();
})();
