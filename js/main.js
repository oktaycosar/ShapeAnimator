// ============================================================
// Shape Animator - Main Panel Logic
// ============================================================

var _statusTimeout;

function setStatus(msg, type) {
    var el = document.getElementById('status');
    el.textContent = msg;
    el.className = 'status-bar ' + (type || '');
    clearTimeout(_statusTimeout);
    _statusTimeout = setTimeout(function() {
        el.textContent = 'Hazır ✨';
        el.className = 'status-bar';
    }, 4000);
}

function callAE(command, params, callback) {
    var jsonStr = params ? JSON.stringify(params) : "{}";
    // JSON içindeki tırnak ve backslashleri ExtendScript için escape et
    var escaped = jsonStr
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r");
    var script = 'main("' + command + '", \'' + escaped + '\')';
    
    csInterface.evalScript(script, function(result) {
        // Sonuç boş/null ise iletişim başarısız
        if (!result || result === "") {
            setStatus('❌ AE ile iletişim kurulamadı! AE açık mı?', 'error');
            if (callback) callback(null);
            return;
        }
        
        try {
            var parsed = JSON.parse(result);
            if (parsed && parsed.error) {
                setStatus('❌ ' + parsed.error, 'error');
            } else if (parsed && parsed.success) {
                var msg = parsed.message || (parsed.animated ? parsed.animated + ' layer animasyonlandı!' : parsed.count + ' shape oluşturuldu!');
                setStatus('✅ ' + msg, 'success');
            }
            if (callback) callback(parsed);
        } catch (e) {
            // JSON parse edilemezse ham sonucu göster
            setStatus('ℹ️ ' + result, '');
            if (callback) callback(result);
        }
    });
}

// --- Slider değer gösterimi ---
document.getElementById('sizeRandom').addEventListener('input', function() {
    document.getElementById('sizeRandomVal').textContent = this.value;
});
document.getElementById('posRandom').addEventListener('input', function() {
    document.getElementById('posRandomVal').textContent = this.value;
});
document.getElementById('cornerRadius').addEventListener('input', function() {
    document.getElementById('cornerRadiusVal').textContent = this.value;
});

// --- Comp bilgisi ---
function refreshComp() {
    csInterface.evalScript('main("getCompInfo", "{}")', function(result) {
        try {
            var info = JSON.parse(result);
            if (info.name) {
                document.getElementById('compInfo').textContent = 
                    '📐 ' + info.name + ' | ' + info.width + 'x' + info.height + ' | ' + info.frameRate + 'fps';
            } else {
                document.getElementById('compInfo').textContent = '⚠️ Kompozisyon seçilmedi';
            }
        } catch(e) {
            document.getElementById('compInfo').textContent = '⚠️ Kompozisyon seçilmedi';
        }
    });
}

// --- Grid Oluştur ---
function createGrid() {
    var dualChip = document.querySelector('.dual-chip.active');
    var secColor = dualChip ? dualChip.getAttribute('data-sec') : null;
    var autoSize = document.getElementById('autoSize').checked;
    var params = {
        cols: parseInt(document.getElementById('gridCols').value),
        rows: parseInt(document.getElementById('gridRows').value),
        shapeType: document.getElementById('shapeType').value,
        shapeWidth: autoSize ? 0 : parseInt(document.getElementById('shapeWidth').value),
        shapeHeight: autoSize ? 0 : parseInt(document.getElementById('shapeHeight').value),
        autoSize: autoSize,
        fillColor: document.getElementById('fillColor').value,
        secColor: secColor,
        sizeRandom: parseInt(document.getElementById('sizeRandom').value),
        posRandom: parseInt(document.getElementById('posRandom').value),
        gapX: autoSize ? 10 : 15,
        gapY: autoSize ? 10 : 12,
        strokeWidth: 1,
        strokeColor: '#ffffff',
        cornerRadius: parseInt(document.getElementById('cornerRadius').value)
    };
    
    setStatus('🔄 Grid oluşturuluyor...');
    callAE('createGrid', params, function(res) {
        if (res && res.success) {
            setStatus('✅ ' + res.count + ' shape oluşturuldu!', 'success');
            refreshComp();
        }
    });
}

// --- Otomatik Boyut Toggle ---
function toggleAutoSize() {
    var auto = document.getElementById('autoSize').checked;
    document.getElementById('shapeWidth').disabled = auto;
    document.getElementById('shapeHeight').disabled = auto;
    if (auto) {
        document.getElementById('shapeWidth').style.opacity = '0.4';
        document.getElementById('shapeHeight').style.opacity = '0.4';
    } else {
        document.getElementById('shapeWidth').style.opacity = '1';
        document.getElementById('shapeHeight').style.opacity = '1';
    }
}

// --- Kompozisyon Oluştur ---
function createComp() {
    var params = {
        compName: document.getElementById('compName').value || 'Shape_Anim',
        compWidth: parseInt(document.getElementById('compWidth').value) || 1920,
        compHeight: parseInt(document.getElementById('compHeight').value) || 1080,
        frameRate: parseFloat(document.getElementById('compFPS').value) || 30,
        duration: parseFloat(document.getElementById('compDuration').value) || 10
    };
    
    setStatus('🎬 Kompozisyon oluşturuluyor...');
    callAE('createComp', params, function(res) {
        if (res && res.success) {
            setStatus('✅ ' + res.message, 'success');
            refreshComp();
        }
    });
}

// --- Tek Shape Oluştur ---
function createSingleShape() {
    var params = {
        shapeType: document.getElementById('shapeType').value,
        shapeWidth: parseInt(document.getElementById('shapeWidth').value),
        shapeHeight: parseInt(document.getElementById('shapeHeight').value),
        fillColor: document.getElementById('fillColor').value,
        strokeWidth: 4,
        strokeColor: '#FFFF00',
        cornerRadius: parseInt(document.getElementById('cornerRadius').value)
    };
    
    setStatus('➕ Shape oluşturuluyor...');
    callAE('createSingleShape', params, function(res) {
        if (res && res.success) {
            setStatus('✅ ' + res.message, 'success');
            refreshComp();
        }
    });
}

// --- Animasyon Ekle ---
function addAnimation() {
    var params = {
        animType: document.getElementById('animType').value,
        duration: parseFloat(document.getElementById('animDuration').value),
        stagger: parseFloat(document.getElementById('animStagger').value),
        direction: document.getElementById('animDirection').value,
        groupMode: document.getElementById('groupMode').checked
    };
    
    setStatus('🎬 Animasyon ekleniyor...');
    callAE('addAnimation', params);
}

// --- Çoğalt ---
function duplicateShapes() {
    var params = {
        copies: 3,
        offsetX: 30,
        offsetY: 30,
        scaleVariation: 0.1
    };
    setStatus('📋 Çoğaltılıyor...');
    callAE('duplicate', params);
}

// --- Rastgele Renk ---
function randomizeColorsBtn() {
    setStatus('🎨 Renkler değiştiriliyor...');
    callAE('randomizeColors', {});
}

// --- Numaralandır ---
function autoNumber() {
    setStatus('🔢 Numaralandırılıyor...');
    var fontSize = parseInt(document.getElementById('numFontSize').value) || 0;
    var textColor = document.getElementById('numTextColor').value || '#FFFFFF';
    var groupWithShape = document.getElementById('groupNumbers').checked;
    callAE('autoNumber', { fontSize: fontSize, textColor: textColor, groupWithShape: groupWithShape });
}

// --- Çift Renk Preset ---
function setDualColor(color1, color2) {
    document.getElementById('fillColor').value = color1;
    document.querySelectorAll('.dual-chip').forEach(function(c) { c.classList.remove('active'); });
    var chips = document.querySelectorAll('.dual-chip');
    for (var i = 0; i < chips.length; i++) {
        var bg = chips[i].style.background;
        if (bg.indexOf(color1) !== -1 && bg.indexOf(color2) !== -1) {
            chips[i].classList.add('active');
            chips[i].setAttribute('data-sec', color2);
        }
    }
    setStatus('🎨 Çift renk: ' + color1 + ' + ' + color2, '');
}

// --- Temizle ---
function clearAllShapes() {
    if (confirm('Tüm shape layer\'ları silmek istediğine emin misin?')) {
        setStatus('🗑️ Siliniyor...');
        callAE('clearAll', {});
    }
}

// --- Hızlı Presetler ---
function runPreset(preset) {
    switch(preset) {
        case 'scatter35':
            callAE('bulkyScatter', {
                totalShapes: 35,
                cols: 7,
                shapeWidth: 70,
                shapeHeight: 50,
                fillColor: '#4A90D9',
                animType: 'scatter',
                duration: 0.6,
                stagger: 0.03
            });
            setStatus('💥 35 kutu dağılıyor...');
            break;
            
        case 'fade20':
            callAE('bulkyScatter', {
                totalShapes: 20,
                cols: 5,
                shapeWidth: 90,
                shapeHeight: 60,
                fillColor: '#2ECC71',
                animType: 'fade_in',
                duration: 0.5,
                stagger: 0.06
            });
            setStatus('🌫️ 20 kutu fade-in...');
            break;
            
        case 'grid12':
            callAE('bulkyScatter', {
                totalShapes: 12,
                cols: 4,
                shapeWidth: 100,
                shapeHeight: 70,
                fillColor: '#E74C3C',
                animType: 'slide_from_left',
                duration: 0.5,
                stagger: 0.08
            });
            setStatus('📐 12\'li grid slide...');
            break;
            
        case 'bounce16':
            callAE('bulkyScatter', {
                totalShapes: 16,
                cols: 4,
                shapeWidth: 80,
                shapeHeight: 80,
                fillColor: '#9B59B6',
                animType: 'scale_bounce',
                duration: 0.7,
                stagger: 0.04
            });
            setStatus('🎾 16 kutu bounce...');
            break;
    }
}

// --- Renk Paleti ---
function setColor(hex) {
    document.getElementById('fillColor').value = hex;
    setStatus('🎨 Renk: ' + hex, '');
}

// --- Sıralama ---
function reorderLayers(action) {
    var labels = { front: 'En öne', back: 'En arkaya', up: 'Yukarı', down: 'Aşağı' };
    setStatus('🔺 ' + labels[action] + ' alınıyor...');
    callAE('reorder', { action: action }, function(res) {
        if (res && res.success) {
            setStatus('✅ ' + res.message, 'success');
        }
    });
}

// --- Drop Shadow ---
function applyShadow(action) {
    setStatus(action === 'add' ? '🌑 Gölge ekleniyor...' : '🌑 Gölge kaldırılıyor...');
    callAE('dropShadow', { action: action, opacity: 40, distance: 8, softness: 5, angle: 135 }, function(res) {
        if (res && res.success) {
            setStatus('✅ ' + res.message, 'success');
        }
    });
}

// --- Panel yüklendi ---
document.addEventListener('DOMContentLoaded', function() {
    refreshComp();
    
    // Her 3 saniyede comp bilgisini kontrol et
    setInterval(refreshComp, 3000);
});
