document.getElementById('soil-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // UI Loading state
    const btnText = document.querySelector('.btn-text');
    const spinner = document.querySelector('.spinner');
    
    btnText.style.opacity = '0';
    spinner.classList.remove('disabled');

    // Gather data
    const payload = {
        "Soil_pH": parseFloat(document.getElementById('Soil_pH').value),
        "Soil_Depth_cm": parseFloat(document.getElementById('Soil_Depth_cm').value),
        "Total_N (%)": parseFloat(document.getElementById('Total_N (%)').value),
        "C_N_Ratio": parseFloat(document.getElementById('C_N_Ratio').value),
        "Bacteria_Abundance (%)": parseFloat(document.getElementById('Bacteria_Abundance (%)').value),
        "Fungi_Abundance (%)": parseFloat(document.getElementById('Fungi_Abundance (%)').value),
        "β_Glucosidase (µmol/g/h)": parseFloat(document.getElementById('β_Glucosidase (µmol/g/h)').value),
        "Urease (µmol/g/h)": parseFloat(document.getElementById('Urease (µmol/g/h)').value),
        "NH4_Ammonium (µg/g)": parseFloat(document.getElementById('NH4_Ammonium (µg/g)').value)
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error);

        updateDashboard(data);

    } catch (err) {
        alert("Error analyzing soil: " + err.message);
    } finally {
        // Reset UI
        btnText.style.opacity = '1';
        spinner.classList.add('disabled');
    }
});

let radarChartInstance = null;

function updateDashboard(data) {
    if(window.innerWidth < 900) {
        document.getElementById('result-card').scrollIntoView({behavior: 'smooth'});
    }

    const { co2_emission, score, category, risk, sustainability, management_guidance, shap_impacts } = data;

    // Update numbers
    document.getElementById('score-value').innerText = score.toFixed(1);
    document.getElementById('co2-value').innerText = co2_emission.toFixed(2);
    
    // Animate SVG Circle
    const circleParams = `${score}, 100`;
    document.getElementById('score-circle-path').setAttribute('stroke-dasharray', circleParams);

    // Get color settings based on category
    let colorHex = "";
    let cssClass = "";
    
    if (category === "Excellent") {
        colorHex = "#10b981";
        cssClass = "excellent";
    } else if (category === "Good") {
        colorHex = "#3b82f6";
        cssClass = "good";
    } else if (category === "Moderate") {
        colorHex = "#f59e0b";
        cssClass = "moderate";
    } else {
        colorHex = "#ef4444";
        cssClass = "poor";
    }

    document.getElementById('score-circle-path').setAttribute('stroke', colorHex);

    // Update Category badge
    const catEl = document.getElementById('category-value');
    catEl.innerText = category;
    catEl.className = `tag ${cssClass}`;

    // Update info blocks (Mini tags now)
    const riskEl = document.getElementById('risk-value');
    riskEl.innerText = risk;
    riskEl.style.color = colorHex;
    riskEl.style.borderColor = colorHex;

    const susEl = document.getElementById('sustainability-value');
    susEl.innerText = sustainability;
    susEl.style.color = colorHex;
    susEl.style.borderColor = colorHex;

    // --- INTERACTIVE REPORTING & EXPLAINABILITY ---
    // Gather inputs to evaluate them
    const inputs = {
        pH: parseFloat(document.getElementById('Soil_pH').value),
        Nitrogen: parseFloat(document.getElementById('Total_N (%)').value),
        CN_Ratio: parseFloat(document.getElementById('C_N_Ratio').value),
        Bacteria: parseFloat(document.getElementById('Bacteria_Abundance (%)').value),
        Fungi: parseFloat(document.getElementById('Fungi_Abundance (%)').value),
        Urease: parseFloat(document.getElementById('Urease (µmol/g/h)').value),
        Glucosidase: parseFloat(document.getElementById('β_Glucosidase (µmol/g/h)').value),
    };

    const evaluated = evaluateMarkers(inputs);

    // Identify Limiting Factor
    const limitingFactors = evaluated.filter(m => m.status === "poor" || m.status === "suboptimal")
                                     .sort((a,b) => a.chartVal - b.chartVal); // worst first
    
    const banner = document.getElementById('limiting-factor-banner');
    if (limitingFactors.length > 0) {
        const topLimiting = limitingFactors[0];
        document.getElementById('bottleneck-text').innerText = `Your soil health is currently capped by ${topLimiting.name}. According to Liebig's Law of the Minimum, resolving this specific constraint will provide the highest return on investment for biological activity.`;
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }

    // Show Export Button
    document.getElementById('export-btn').style.display = 'flex';

    // Create explainable specific solutions based on High/Low suboptimal markers
    let specific_solutions = [];
    evaluated.forEach(m => {
        if (m.status !== "optimal") {
            if (m.name === "Soil pH" && inputs.pH < 6.0) 
                specific_solutions.push("Soil pH is Very Low (Acidic): Apply agricultural lime to safely raise soil pH and improve enzymatic activity.");
            else if (m.name === "Soil pH" && inputs.pH > 7.5) 
                specific_solutions.push("Soil pH is Very High (Alkaline): Consider adding elemental sulfur or acidic organic mulches to lower an alkaline pH naturally.");
            
            else if (m.name === "Total N (%)" && inputs.Nitrogen < 0.15) 
                specific_solutions.push("Total Nitrogen is Low: Plant nitrogen-fixing cover crops (e.g., legumes) or topdress with organic N fertilizers.");
            else if (m.name === "Total N (%)" && inputs.Nitrogen > 0.4) 
                specific_solutions.push("Total Nitrogen is High: Excess nitrogen can cause microbial burn or leaching. Plant heavy-feeding cover crops or add high-carbon mulch.");
            
            else if (m.name === "C:N Ratio" && inputs.CN_Ratio > 24) 
                specific_solutions.push("C:N Ratio is High (Carbon-Heavy): Microbes are tying up available nitrogen. Incorporate green manure (N-rich) to balance decomposition.");
            else if (m.name === "C:N Ratio" && inputs.CN_Ratio < 10) 
                specific_solutions.push("C:N Ratio is Low (Nitrogen-Heavy): Rapid decomposition risks nitrogen loss and volatilization. Add brown matter (straw, woodchips) to provide stable carbon.");
            
            else if (m.name === "Bacteria (%)" && inputs.Bacteria < 0.4) 
                specific_solutions.push("Bacterial Abundance is Low: Introduce aerobic compost teas or rich inoculants to accelerate base decomposition.");
            else if (m.name === "Bacteria (%)" && inputs.Bacteria > 0.7) 
                specific_solutions.push("Bacterial Abundance is High: The soil is heavily bacterially-dominated. Reduce tillage to allow fungal networks to balance the microbiome.");

            else if (m.name === "Fungi (%)" && inputs.Fungi < 0.3) 
                specific_solutions.push("Fungal Abundance is Low: Transition to a no-till/low-till system to allow vital mycorrhizal networks to establish and break down complex lignins.");
            
            else if (m.name === "Urease Act.") 
                specific_solutions.push("Urease Activity is Low: Sluggish urease implies nitrogen mineralization is stalling. Feed the nitrogen cycle with stable organic amendments.");
            
            else if (m.name === "β-Glucosidase") 
                specific_solutions.push("β-Glucosidase is Low: Stalled carbon turnover. Invigorate microbes with diverse root exudates from living cover crops.");
        }
    });

    // Combine standard backend guidance and specific targeted actions
    const final_guidance = [...management_guidance, ...specific_solutions];

    // Update guidance section with explanations
    const guidanceList = document.getElementById('guidance-list');
    guidanceList.innerHTML = "";
    final_guidance.forEach(guide => {
        const li = document.createElement('li');
        const splitGuide = guide.includes(":") ? guide.split(":") : null;
        if (splitGuide && splitGuide.length > 1) {
            li.innerHTML = `<strong>${splitGuide[0]}:</strong> ${splitGuide[1]}`;
        } else {
            li.innerText = guide;
        }
        guidanceList.appendChild(li);
    });

    // Render SHAP Impacts if available
    const shapSection = document.getElementById('model-impact-section');
    const shapList = document.getElementById('shap-impacts-list');
    
    if (shap_impacts && shap_impacts.length > 0) {
        shapSection.style.display = 'block';
        shapList.innerHTML = '';
        
        // Take top 4 absolute impacts to display
        const top_impacts = shap_impacts.slice(0, 4);
        
        top_impacts.forEach(impact => {
            const isPositive = impact.impact > 0;
            const signMark = isPositive ? '▲' : '▼';
            const colorClass = isPositive ? 'excellent' : 'poor';
            const textClass = isPositive ? 'Increased Score' : 'Decreased Score';
            
            // Format feature name nicely
            let featName = impact.feature;
            featName = featName.replace('clr_', 'CLR ').replace('Soil_', 'Soil ').replace('_', ' ');

            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.marginBottom = '0.5rem';
            div.style.padding = '0.75rem';
            div.style.background = 'rgba(255,255,255,0.05)';
            div.style.border = '1px solid rgba(255,255,255,0.1)';
            div.style.borderRadius = '8px';
            
            div.innerHTML = `
                <span style="font-weight: 600; font-size: 0.85rem; color: #ddd;">${featName}</span>
                <span class="${colorClass}" style="font-weight: 700; font-size: 0.85rem;">
                    ${signMark} ${textClass}
                </span>
            `;
            shapList.appendChild(div);
        });
    }

    renderMarkerGrid(evaluated);
    renderChart(evaluated, colorHex);
}

function evaluateMarkers(inputs) {
    const format = (val, name, optCondition, subCondition, desc) => {
        let status = "poor";
        if (optCondition) status = "optimal";
        else if (subCondition) status = "suboptimal";
        
        // Normalize 0-100 for radar chart approx
        let chartVal = status === "optimal" ? 100 : (status === "suboptimal" ? 60 : 30);

        return { name, value: val, status, desc, chartVal };
    };

    return [
        format(inputs.pH, "Soil pH", inputs.pH >= 6.0 && inputs.pH <= 7.5, inputs.pH >= 5.5 && inputs.pH <= 8.0, "pH heavily affects microbial enzyme activity and nutrient availability."),
        format(inputs.Nitrogen, "Total N (%)", inputs.Nitrogen >= 0.15 && inputs.Nitrogen <= 0.4, inputs.Nitrogen >= 0.1 && inputs.Nitrogen <= 0.5, "Nitrogen is critical for microbial synthesis and carbon breakdown."),
        format(inputs.CN_Ratio, "C:N Ratio", inputs.CN_Ratio >= 10 && inputs.CN_Ratio <= 24, inputs.CN_Ratio >= 8 && inputs.CN_Ratio <= 30, "Balances carbon for energy and nitrogen for microbial growth."),
        format(inputs.Bacteria, "Bacteria (%)", inputs.Bacteria >= 0.4 && inputs.Bacteria <= 0.7, inputs.Bacteria >= 0.25 && inputs.Bacteria <= 0.8, "Bacterial dominance speeds up decomposition and CO2 emissions."),
        format(inputs.Fungi, "Fungi (%)", inputs.Fungi >= 0.3, inputs.Fungi >= 0.15, "Fungi are essential for breaking down complex organic matter."),
        format(inputs.Urease, "Urease Act.", inputs.Urease >= 20, inputs.Urease >= 10, "Indicator of organic nitrogen mineralization capacity."),
        format(inputs.Glucosidase, "β-Glucosidase", inputs.Glucosidase >= 40, inputs.Glucosidase >= 20, "Catalyzes the final step in cellulose degradation (carbon cycling).")
    ];
}

function renderMarkerGrid(markets) {
    const grid = document.getElementById('marker-grid');
    grid.innerHTML = "";
    markets.forEach(m => {
        const card = document.createElement('div');
        card.className = `marker-card ${m.status}`;
        card.innerHTML = `
            <div class="marker-title">${m.name}</div>
            <div class="marker-value">${m.value}</div>
            <div class="marker-status ${m.status}">${m.status.toUpperCase()}</div>
            <div class="tooltip">${m.desc}</div>
        `;
        grid.appendChild(card);
    });
}

function renderChart(markets, colorHex) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    const labels = markets.map(m => m.name);
    const data = markets.map(m => m.chartVal);

    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.font.family = 'Inter';

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Marker Health Profile',
                data: data,
                backgroundColor: colorHex + '40', // 25% opacity
                borderColor: colorHex,
                pointBackgroundColor: colorHex,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: colorHex,
                borderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 10 }
                    },
                    ticks: {
                        display: false,
                        min: 0,
                        max: 100,
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' Health Status: ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}
