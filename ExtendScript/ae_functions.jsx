// ============================================================
// Shape Animator - After Effects ExtendScript
// PowerPoint tarzı shape animasyonları
// ============================================================

// --- Yardımcı Fonksiyonlar ---

function hexToRGB(hex) {
    hex = hex.replace('#', '');
    return [
        parseInt(hex.substring(0, 2), 16) / 255,
        parseInt(hex.substring(2, 4), 16) / 255,
        parseInt(hex.substring(4, 6), 16) / 255
    ];
}

function getActiveComp() {
    try {
        if (!app.project) {
            return null;
        }
        var item = app.project.activeItem;
        if (item && item instanceof CompItem) {
            return item;
        }
    } catch (e) {
        // app.project erişilemezse (AE başlatılmamış olabilir)
    }
    return null;
}

// --- Shape Oluşturma ---

function createShapeLayer(comp, shapeType, width, height, fillColor, strokeColor, strokeWidth, cornerRadius) {
    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = "Shape_" + (comp.numLayers);
    
    // ADBE Root Vectors Group = shape layer'ın ana içerik grubu (MATCH NAME kullan!)
    var contents = shapeLayer.property("ADBE Root Vectors Group");
    var shapeGroup = contents.addProperty("ADBE Vector Group");
    var groupContents = shapeGroup.property("Contents");
    shapeGroup.name = "Shape " + shapeType;
    
    // --- SHAPE PATH ---
    if (shapeType === "bezier") {
        // GERÇEK VEKTÖREL BEZIER PATH - vertex'leri düzenlenebilir
        var pathGroup = groupContents.addProperty("ADBE Vector Shape - Group");
        var path = pathGroup.property("ADBE Vector Shape");
        
        // Dikdörtgen şeklinde 4 vertex'li Bezier path oluştur
        var halfW = width / 2;
        var halfH = height / 2;
        var vertices = [
            [-halfW, -halfH],  // sol üst
            [ halfW, -halfH],  // sağ üst
            [ halfW,  halfH],  // sağ alt
            [-halfW,  halfH]   // sol alt
        ];
        var inTangents = [
            [0, 0], [0, 0], [0, 0], [0, 0]
        ];
        var outTangents = [
            [0, 0], [0, 0], [0, 0], [0, 0]
        ];
        
        var bezierPath = path.createPath(vertices, inTangents, outTangents, true);
        
        // Corner radius uygula (round corner)
        if (cornerRadius && cornerRadius > 0) {
            var cr = cornerRadius;
            vertices = [
                [-halfW + cr, -halfH],
                [ halfW - cr, -halfH],
                [ halfW, -halfH + cr],
                [ halfW,  halfH - cr],
                [ halfW - cr,  halfH],
                [-halfW + cr,  halfH],
                [-halfW,  halfH - cr],
                [-halfW, -halfH + cr]
            ];
            // Her vertex için dairesel tangent
            var tanLen = cr * 0.5522847498; // Bezier daire yaklaşımı
            inTangents = [
                [-tanLen, 0], [0, -tanLen], [tanLen, 0], [0, tanLen],
                [tanLen, 0], [0, -tanLen], [-tanLen, 0], [0, tanLen]
            ];
            outTangents = [
                [tanLen, 0], [0, tanLen], [-tanLen, 0], [0, -tanLen],
                [-tanLen, 0], [0, tanLen], [tanLen, 0], [0, -tanLen]
            ];
            bezierPath = path.createPath(vertices, inTangents, outTangents, true);
        }
        
        path.setValue(bezierPath);
        
    } else if (shapeType === "ellipse") {
        var shapePath = groupContents.addProperty("ADBE Vector Shape - Ellipse");
        shapePath.property("ADBE Vector Ellipse Size").setValue([width, height]);
    } else if (shapeType === "polygon") {
        var shapePath = groupContents.addProperty("ADBE Vector Shape - Star");
        shapePath.property("ADBE Vector Star Type").setValue(1); // 1=Polygon
        shapePath.property("ADBE Vector Star Points").setValue(6);
        shapePath.property("ADBE Vector Star Outer Radius").setValue(width / 2);
    } else if (shapeType === "star") {
        var shapePath = groupContents.addProperty("ADBE Vector Shape - Star");
        shapePath.property("ADBE Vector Star Type").setValue(2); // 2=Star
        shapePath.property("ADBE Vector Star Points").setValue(5);
        shapePath.property("ADBE Vector Star Outer Radius").setValue(width / 2);
        shapePath.property("ADBE Vector Star Inner Radius").setValue(width / 4);
    } else {
        // rect, rounded_rect vb. - hepsi Rect parametrik
        var shapePath = groupContents.addProperty("ADBE Vector Shape - Rect");
        shapePath.property("ADBE Vector Rect Size").setValue([width, height]);
        var cr = (cornerRadius !== undefined && cornerRadius !== null) ? cornerRadius : 0;
        shapePath.property("ADBE Vector Rect Roundness").setValue(cr);
    }
    
    // --- FILL (her zaman düz renk) ---
    var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
    var rgb = hexToRGB(fillColor || "#4A90D9");
    try {
        fill.property("ADBE Vector Fill Color").setValue(rgb);
        fill.property("ADBE Vector Graphic Opacity").setValue(100);
    } catch (fe) {
        fill.property("Color").setValue(rgb);
        fill.property("Opacity").setValue(100);
    }
    
    // --- STROKE ---
    if (strokeWidth && strokeWidth > 0) {
        try {
            var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
            var strokeRgb = hexToRGB(strokeColor || "#2C5F8A");
            stroke.property("ADBE Vector Stroke Color").setValue(strokeRgb);
            stroke.property("ADBE Vector Stroke Width").setValue(strokeWidth);
        } catch (se) {
            var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
            var strokeRgb = hexToRGB(strokeColor || "#2C5F8A");
            stroke.property("Color").setValue(strokeRgb);
            stroke.property("Stroke Width").setValue(strokeWidth);
        }
    }
    
    // Position - kompozisyon merkezine
    shapeLayer.property("ADBE Transform Group").property("ADBE Position").setValue([comp.width / 2, comp.height / 2]);
    
    return shapeLayer;
}

// --- Kompozisyon Oluşturma ---

function createComposition(params) {
    params = JSON.parse(params);
    var compName = params.compName || "Yeni Kompozisyon";
    var width = parseInt(params.compWidth) || 1920;
    var height = parseInt(params.compHeight) || 1080;
    var frameRate = parseFloat(params.frameRate) || 30;
    var duration = parseFloat(params.duration) || 10;
    
    try {
        if (!app.project) {
            app.newProject();
        }
        
        var comp = app.project.items.addComp(compName, width, height, 1, duration, frameRate);
        
        // Beyaz arka plan solid ekle - shape'ler her zaman görünür olsun
        var bgSolid = comp.layers.addSolid([1, 1, 1], "BG_White", width, height, 1);
        bgSolid.moveToBeginning();
        
        comp.openInViewer();
        
        return JSON.stringify({
            success: true,
            name: comp.name,
            width: comp.width,
            height: comp.height,
            frameRate: comp.frameRate,
            duration: comp.duration,
            message: "Kompozisyon oluşturuldu: " + compName
        });
    } catch (e) {
        return JSON.stringify({ error: "Kompozisyon oluşturulamadı: " + e.toString() });
    }
}

// --- Tek Shape Oluşturma ---

function createSingleShape(params) {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Lütfen bir kompozisyon seçin!" });
    }
    
    params = JSON.parse(params);
    
    var shapeType = params.shapeType || "rounded_rect";
    var shapeWidth = parseInt(params.shapeWidth) || 80;
    var shapeHeight = parseInt(params.shapeHeight) || 60;
    var fillColor = params.fillColor || "#4A90D9";
    var strokeColor = params.strokeColor || "#ffffff";
    var strokeWidth = params.strokeWidth || 1;
    var cornerRadius = parseInt(params.cornerRadius) || 8;
    
    // Pozisyon: kompozisyonun ortası
    var posX = params.posX !== undefined ? parseFloat(params.posX) : comp.width / 2;
    var posY = params.posY !== undefined ? parseFloat(params.posY) : comp.height / 2;
    
    app.beginUndoGroup("Shape Animator - Tek Shape");
    
    var layer = createShapeLayer(comp, shapeType, shapeWidth, shapeHeight, fillColor, strokeColor, strokeWidth, cornerRadius);
    layer.property("Position").setValue([posX, posY]);
    
    // Oluşturulan layer'ı seç (görünürlük için)
    layer.selected = true;
    
    app.endUndoGroup();
    
    return JSON.stringify({
        success: true,
        count: 1,
        name: layer.name,
        message: "1 shape oluşturuldu: " + layer.name
    });
}

// --- Grid Layout ---

function createShapeGrid(params) {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Lütfen bir kompozisyon seçin!" });
    }
    
    params = JSON.parse(params);
    
    var cols = params.cols || 5;
    var rows = params.rows || 7;
    var shapeWidth = params.shapeWidth || 80;
    var shapeHeight = params.shapeHeight || 60;
    var gapX = params.gapX || 15;
    var gapY = params.gapY || 15;
    var shapeType = params.shapeType || "rounded_rect";
    var fillColor = params.fillColor || "#4A90D9";
    var strokeColor = params.strokeColor || "#2C5F8A";
    var strokeWidth = params.strokeWidth || 2;
    var cornerRadius = params.cornerRadius || 8;
    var sizeRandom = params.sizeRandom || 0;
    var posRandom = params.posRandom || 0;
    var secColor = params.secColor || null;
    
    var totalWidth = cols * shapeWidth + (cols - 1) * gapX;
    var totalHeight = rows * shapeHeight + (rows - 1) * gapY;
    var startX = (comp.width - totalWidth) / 2 + shapeWidth / 2;
    var startY = (comp.height - totalHeight) / 2 + shapeHeight / 2;
    
    var createdLayers = [];
    var colorIndex = 0;
    
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var w = shapeWidth + (Math.random() - 0.5) * sizeRandom * 2;
            var h = shapeHeight + (Math.random() - 0.5) * sizeRandom * 2;
            
            var x = startX + c * (shapeWidth + gapX) + (Math.random() - 0.5) * posRandom * 2;
            var y = startY + r * (shapeHeight + gapY) + (Math.random() - 0.5) * posRandom * 2;
            
            var useColor = (secColor && colorIndex % 2 === 1) ? secColor : fillColor;
            var layer = createShapeLayer(comp, shapeType, w, h, useColor, strokeColor, strokeWidth, cornerRadius);
            layer.property("Position").setValue([x, y]);
            colorIndex++;
            
            createdLayers.push({
                index: layer.index,
                name: layer.name,
                x: x,
                y: y
            });
        }
    }
    
    return JSON.stringify({
        success: true,
        count: createdLayers.length,
        layers: createdLayers
    });
}

// --- Çoğaltma (Duplicate) ---

function duplicateShapes(params) {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Kompozisyon seçin!" });
    }
    
    params = JSON.parse(params);
    var copies = params.copies || 1;
    var offsetX = params.offsetX || 50;
    var offsetY = params.offsetY || 50;
    var scaleVariation = params.scaleVariation || 0;
    
    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        return JSON.stringify({ error: "Layer seçin!" });
    }
    
    var created = [];
    for (var s = 0; s < selectedLayers.length; s++) {
        var orig = selectedLayers[s];
        for (var i = 0; i < copies; i++) {
            var dup = orig.duplicate();
            var pos = dup.property("Position").value;
            var newX = pos[0] + (i + 1) * offsetX;
            var newY = pos[1] + (i + 1) * offsetY;
            dup.property("Position").setValue([newX, newY]);
            
            if (scaleVariation > 0) {
                var scl = 1 + (Math.random() - 0.5) * scaleVariation * 2;
                dup.property("Scale").setValue([scl * 100, scl * 100]);
            }
            
            created.push({ index: dup.index, name: dup.name });
        }
    }
    
    return JSON.stringify({ success: true, count: created.length });
}

// --- Animasyon Ekleme ---

function getAnimKeyframes(animType, layerIndex, comp, delay, duration) {
    var layer = comp.layer(layerIndex);
    if (!layer) return;
    
    var startTime = comp.time + delay;
    var endTime = startTime + duration;
    
    switch (animType) {
        case "fade_in":
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(endTime, 100);
            break;
            
        case "slide_from_left":
            var pos = layer.property("Position").value;
            layer.property("Position").setValueAtTime(startTime, [pos[0] - comp.width, pos[1]]);
            layer.property("Position").setValueAtTime(endTime, pos);
            // opacity ile birleştir
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(startTime + duration * 0.3, 100);
            break;
            
        case "slide_from_right":
            var pos = layer.property("Position").value;
            layer.property("Position").setValueAtTime(startTime, [pos[0] + comp.width, pos[1]]);
            layer.property("Position").setValueAtTime(endTime, pos);
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(startTime + duration * 0.3, 100);
            break;
            
        case "slide_from_top":
            var pos = layer.property("Position").value;
            layer.property("Position").setValueAtTime(startTime, [pos[0], pos[1] - comp.height]);
            layer.property("Position").setValueAtTime(endTime, pos);
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(startTime + duration * 0.3, 100);
            break;
            
        case "slide_from_bottom":
            var pos = layer.property("Position").value;
            layer.property("Position").setValueAtTime(startTime, [pos[0], pos[1] + comp.height]);
            layer.property("Position").setValueAtTime(endTime, pos);
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(startTime + duration * 0.3, 100);
            break;
            
        case "scale_up":
            layer.property("Scale").setValueAtTime(startTime, [0, 0]);
            layer.property("Scale").setValueAtTime(endTime, [100, 100]);
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(startTime + duration * 0.2, 100);
            break;
            
        case "scale_bounce":
            layer.property("Scale").setValueAtTime(startTime, [0, 0]);
            layer.property("Scale").setValueAtTime(startTime + duration * 0.6, [120, 120]);
            layer.property("Scale").setValueAtTime(endTime, [100, 100]);
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(startTime + duration * 0.2, 100);
            break;
            
        case "rotate_in":
            layer.property("Rotation").setValueAtTime(startTime, -180);
            layer.property("Rotation").setValueAtTime(endTime, 0);
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(startTime + duration * 0.3, 100);
            layer.property("Scale").setValueAtTime(startTime, [0, 0]);
            layer.property("Scale").setValueAtTime(endTime, [100, 100]);
            break;
            
        case "scatter":
            // Rastgele dağılma - her shape kendi final pozisyonuna
            var finalPos = layer.property("Position").value;
            var scatterX = finalPos[0] + (Math.random() - 0.5) * comp.width * 1.5;
            var scatterY = finalPos[1] + (Math.random() - 0.5) * comp.height * 1.5;
            layer.property("Position").setValueAtTime(startTime, [scatterX, scatterY]);
            layer.property("Position").setValueAtTime(endTime, finalPos);
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(startTime + duration * 0.2, 100);
            layer.property("Scale").setValueAtTime(startTime, [30, 30]);
            layer.property("Scale").setValueAtTime(endTime, [100, 100]);
            break;
            
        default: // "fade_in"
            layer.property("Opacity").setValueAtTime(startTime, 0);
            layer.property("Opacity").setValueAtTime(endTime, 100);
            break;
    }
    
    // Kolaylık (easy ease) ekle
    try {
        var opacity = layer.property("Opacity");
        for (var k = 1; k <= opacity.numKeys; k++) {
            var easeIn = new KeyframeEase(0, 33.33);
            var easeOut = new KeyframeEase(0, 33.33);
            opacity.setTemporalEaseAtKey(k, [easeIn], [easeOut]);
        }
    } catch (e) {}
}

function addAnimation(params) {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Kompozisyon seçin!" });
    }
    
    params = JSON.parse(params);
    var animType = params.animType || "fade_in";
    var duration = params.duration || 0.5;
    var stagger = params.stagger || 0.05;     // her shape arası gecikme
    var direction = params.direction || "forward";
    
    var layers;
    if (params.groupMode) {
        // Tüm seçili layer'lara uygula
        layers = comp.selectedLayers;
    } else {
        // Tüm shape layer'ları bul
        layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var l = comp.layer(i);
            if (l.name.indexOf("Shape_") === 0 || l.name.indexOf("Shape ") === 0) {
                layers.push(l);
            }
        }
    }
    
    if (layers.length === 0) {
        // Hiç shape yoksa, tüm layer'lara uygula
        for (var i = 1; i <= comp.numLayers; i++) {
            layers.push(comp.layer(i));
        }
    }
    
    // Direction: forward / reverse / random
    if (direction === "reverse") {
        layers.reverse();
    } else if (direction === "random") {
        layers.sort(function() { return Math.random() - 0.5; });
    }
    
    app.beginUndoGroup("Shape Animator - Animate");
    
    for (var i = 0; i < layers.length; i++) {
        var delay = i * stagger;
        getAnimKeyframes(animType, layers[i].index, comp, delay, duration);
    }
    
    app.endUndoGroup();
    
    return JSON.stringify({
        success: true,
        animated: layers.length,
        type: animType
    });
}

// --- Gruplandırma ---

function groupSelected(params) {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Kompozisyon seçin!" });
    }
    
    params = JSON.parse(params);
    var groupName = params.groupName || "Group";
    
    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length < 2) {
        return JSON.stringify({ error: "En az 2 layer seçin!" });
    }
    
    // Pre-compose ile gruplandır (After Effects'teki en iyi yöntem)
    var firstIdx = selectedLayers[0].index;
    app.executeCommand(2072); // Pre-compose (Ctrl+Shift+C)
    
    // Pre-compose dialog'u için basit yaklaşım - indeksle
    
    return JSON.stringify({ 
        success: true, 
        message: "Layer'ları seçip Ctrl+Shift+C ile Pre-Compose yapın. Panel bunu otomatik yapacak."
    });
}

// --- Toplu Animasyon (Bulky) ---

function bulkyScatter(params) {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Kompozisyon seçin!" });
    }
    
    params = JSON.parse(params);
    var totalShapes = params.totalShapes || 35;
    var cols = params.cols || 7;
    var rows = Math.ceil(totalShapes / cols);
    var shapeWidth = params.shapeWidth || 70;
    var shapeHeight = params.shapeHeight || 50;
    var fillColor = params.fillColor || "#4A90D9";
    var animType = params.animType || "scatter";
    var duration = params.duration || 0.6;
    var stagger = params.stagger || 0.03;
    
    var gapX = 15;
    var gapY = 12;
    var totalWidth = cols * shapeWidth + (cols - 1) * gapX;
    var totalHeight = rows * shapeHeight + (rows - 1) * gapY;
    var startX = (comp.width - totalWidth) / 2 + shapeWidth / 2;
    var startY = (comp.height - totalHeight) / 2 + shapeHeight / 2;
    
    var colors = [fillColor, "#E74C3C", "#2ECC71", "#F39C12", "#9B59B6", "#1ABC9C", "#E67E22", "#3498DB"];
    
    app.beginUndoGroup("Shape Animator - Bulky Scatter");
    
    var count = 0;
    for (var r = 0; r < rows && count < totalShapes; r++) {
        for (var c = 0; c < cols && count < totalShapes; c++) {
            var x = startX + c * (shapeWidth + gapX);
            var y = startY + r * (shapeHeight + gapY);
            var color = colors[count % colors.length];
            
            var layer = createShapeLayer(comp, "rounded_rect", shapeWidth, shapeHeight, color, "#ffffff", 1, 6);
            layer.property("Position").setValue([x, y]);
            
            var delay = count * stagger;
            getAnimKeyframes(animType, layer.index, comp, delay, duration);
            
            count++;
        }
    }
    
    app.endUndoGroup();
    
    return JSON.stringify({
        success: true,
        created: count,
        message: count + " shape oluşturuldu ve '" + animType + "' animasyonu eklendi!"
    });
}

// --- Otomatik Numaralandırma ---

function autoNumber(params) {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Kompozisyon seçin!" });
    }
    
    params = params ? JSON.parse(params) : {};
    var fontSize = parseInt(params.fontSize) || 0;   // 0 = otomatik (shape boyutunun %60'ı)
    var textColor = params.textColor || "#FFFFFF";
    var offsetY = params.offsetY || 0;               // 0 = tam merkez
    var groupWithShape = params.groupWithShape !== undefined ? params.groupWithShape : true; // varsayılan: grupla
    
    // 1. Önce seçili layer'ları kullan, yoksa Shape_ ile başlayanları bul
    var shapes = [];
    var selectedLayers = comp.selectedLayers;
    
    if (selectedLayers.length > 0) {
        // Sadece seçili shape/text/AV layer'larını kullan
        for (var si = 0; si < selectedLayers.length; si++) {
            shapes.push(selectedLayers[si]);
        }
    } else {
        // Shape_ ile başlayan layer'ları bul
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.name.indexOf("Shape_") === 0) {
                shapes.push(layer);
            }
        }
    }
    
    if (shapes.length === 0) {
        return JSON.stringify({ error: "Numaralandırılacak layer bulunamadı! Shape seçin veya grid oluşturun." });
    }
    
    app.beginUndoGroup("Shape Animator - Auto Number");
    
    // Eski numara layer'larını temizle
    for (var d = comp.numLayers; d >= 1; d--) {
        var dl = comp.layer(d);
        if (dl.name.indexOf("#") === 0) {
            dl.remove();
        }
    }
    
    var textRgb = hexToRGB(textColor);
    var count = 0;
    
    // Ters sırada (alttaki shape'ler önce gelsin, 1 altta olsun)
    for (var s = shapes.length - 1; s >= 0; s--) {
        var shape = shapes[s];
        var num = count + 1;
        var pos = shape.property("Position").value;
        
        // Shape boyutunu tahmin et (font boyutu için)
        var estSize = estimateShapeSize(shape, comp);
        var calcFontSize = fontSize;
        if (!calcFontSize || calcFontSize <= 0) {
            // Kullanıcı belirtmediyse: shape boyutunun %60'ı (daha büyük ve okunaklı)
            calcFontSize = Math.max(18, Math.min(200, Math.round(estSize * 0.6)));
        }
        
        var textLayer = comp.layers.addText(num.toString());
        textLayer.name = "#" + num;
        
        // NUMARA + SHAPE GRUPLAMA (Parent-Child)
        if (groupWithShape) {
            // Parent yapınca pozisyon relative olur - shape'in merkezine [0, offsetY]
            textLayer.property("Position").setValue([0, offsetY]);
            textLayer.parent = shape;
        } else {
            textLayer.property("Position").setValue([pos[0], pos[1] + offsetY]);
        }
        
        // Text stilini ayarla (doğru match name ile)
        try {
            var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
            var textDoc = textProp.value;
            try { textDoc.resetCharStyle(); } catch (rs) {}
            textDoc.fontSize = calcFontSize;
            textDoc.fillColor = textRgb;
            textDoc.justification = ParagraphJustification.CENTER_JUSTIFIED;
            textDoc.font = "Arial-BoldMT";
            textProp.setValue(textDoc);
        } catch (te) {
            // Fallback: Source Text ile dene
            try {
                var textProp2 = textLayer.property("Source Text");
                var textDoc2 = textProp2.value;
                textDoc2.fontSize = calcFontSize;
                textDoc2.fillColor = textRgb;
                textDoc2.justification = ParagraphJustification.CENTER_JUSTIFIED;
                textDoc2.font = "Arial-BoldMT";
                textProp2.setValue(textDoc2);
            } catch (te2) {}
        }
        
        // Opacity animasyonu
        textLayer.property("Opacity").setValueAtTime(comp.time, 0);
        textLayer.property("Opacity").setValueAtTime(comp.time + count * 0.03 + 0.1, 100);
        
        count++;
    }
    
    app.endUndoGroup();
    
    return JSON.stringify({
        success: true,
        count: count,
        grouped: groupWithShape,
        message: count + " layer numaralandırıldı" + (groupWithShape ? " ve gruplandı" : "") + "! (1-" + count + ")"
    });
}

// Shape'in yaklaşık boyutunu tahmin et (font orantısı için)
function estimateShapeSize(layer, comp) {
    try {
        // Shape layer'ın içeriğini kontrol et - ADBE Root Vectors Group
        var contents = layer.property("Contents");
        if (!contents) {
            contents = layer.property("ADBE Root Vectors Group");
        }
        if (!contents) return comp ? comp.height * 0.06 : 60;
        
        // İlk grubu bul
        for (var g = 1; g <= contents.numProperties; g++) {
            var group = contents.property(g);
            if (group.matchName === "ADBE Vector Group") {
                var groupContent = group.property("Contents");
                if (!groupContent) continue;
                
                // Path'i bul
                for (var p = 1; p <= groupContent.numProperties; p++) {
                    var pathProp = groupContent.property(p);
                    var mn = pathProp.matchName;
                    if (mn === "ADBE Vector Shape - Rect" || mn === "ADBE Vector Shape - Ellipse") {
                        var sz = pathProp.property("Size").value;
                        // Genişlik ve yüksekliğin ortalaması
                        return (sz[0] + sz[1]) / 2;
                    }
                    if (mn === "ADBE Vector Shape - Star") {
                        var outerR = pathProp.property("Outer Radius").value;
                        return outerR * 2;
                    }
                    if (mn === "ADBE Vector Shape - Group") {
                        // Bezier path - bounding box hesapla
                        var path = pathProp.property("ADBE Vector Shape").value;
                        if (path && path.vertices) {
                            var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                            for (var vi = 0; vi < path.vertices.length; vi++) {
                                var v = path.vertices[vi];
                                if (v[0] < minX) minX = v[0];
                                if (v[0] > maxX) maxX = v[0];
                                if (v[1] < minY) minY = v[1];
                                if (v[1] > maxY) maxY = v[1];
                            }
                            return Math.max(maxX - minX, maxY - minY);
                        }
                    }
                }
            }
        }
    } catch (e) {}
    
    // Varsayılan: comp yüksekliğinin %6'sı (daha büyük)
    return comp ? comp.height * 0.06 : 60;
}

// --- Temizleme ---

function clearAllShapes() {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Kompozisyon seçin!" });
    }
    
    app.beginUndoGroup("Shape Animator - Clear");
    
    var removed = 0;
    for (var i = comp.numLayers; i >= 1; i--) {
        var layer = comp.layer(i);
        if (layer.name.indexOf("Shape_") === 0 || layer.name.indexOf("Shape ") === 0) {
            layer.remove();
            removed++;
        }
    }
    
    app.endUndoGroup();
    
    return JSON.stringify({ success: true, removed: removed });
}

// --- Rastgele Renk ---

function randomizeColors() {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ error: "Kompozisyon seçin!" });
    }
    
    var palette = ["#E74C3C", "#2ECC71", "#F39C12", "#9B59B6", "#1ABC9C", "#E67E22", "#3498DB", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
    
    app.beginUndoGroup("Shape Animator - Randomize Colors");
    
    var changed = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        if (layer.name.indexOf("Shape_") === 0 || layer.name.indexOf("Shape ") === 0) {
            try {
                // Yeni yapı: Contents > Group > Contents > Fill
                var contents = layer.property("Contents");
                var fill = null;
                for (var g = 1; g <= contents.numProperties; g++) {
                    var group = contents.property(g);
                    if (group.matchName === "ADBE Vector Group") {
                        var gc = group.property("Contents");
                        if (gc) {
                            for (var p = 1; p <= gc.numProperties; p++) {
                                var prop = gc.property(p);
                                var mn = prop.matchName;
                                if (mn === "ADBE Vector Graphic - Fill" || mn === "ADBE Vector Graphic - G-Fill") {
                                    fill = prop;
                                    break;
                                }
                            }
                        }
                        if (fill) break;
                    }
                }
                if (fill) {
                    var color = hexToRGB(palette[Math.floor(Math.random() * palette.length)]);
                    fill.property("Color").setValue(color);
                    changed++;
                }
            } catch (e) {}
        }
    }
    
    app.endUndoGroup();
    
    return JSON.stringify({ success: true, changed: changed });
}

// --- Katman Sıralama ---

function reorderLayers(params) {
    var comp = getActiveComp();
    if (!comp) return JSON.stringify({ error: "Kompozisyon seçin!" });
    
    params = JSON.parse(params);
    var action = params.action || "front";
    
    // selectedLayers referanslarını kopyala (read-only olabilir)
    var sel = comp.selectedLayers;
    var layers = [];
    for (var k = 0; k < sel.length; k++) {
        layers.push(sel[k]);
    }
    
    if (layers.length === 0) {
        return JSON.stringify({ error: "En az 1 layer seçin!" });
    }
    
    app.beginUndoGroup("Shape Animator - Reorder");
    
    switch (action) {
        case "front":
            for (var i = 0; i < layers.length; i++) {
                layers[i].moveToBeginning();
            }
            break;
        case "back":
            for (var i = layers.length - 1; i >= 0; i--) {
                layers[i].moveToEnd();
            }
            break;
        case "up":
            // Yukarı taşırken üstten alta doğru işle (index değişimini önle)
            layers.sort(function(a, b) { return a.index - b.index; });
            for (var u = 0; u < layers.length; u++) {
                if (layers[u].index > 1) {
                    layers[u].moveBefore(comp.layer(layers[u].index - 1));
                }
            }
            break;
        case "down":
            // Aşağı taşırken alttan üste doğru işle
            layers.sort(function(a, b) { return b.index - a.index; });
            for (var d = 0; d < layers.length; d++) {
                if (layers[d].index < comp.numLayers) {
                    layers[d].moveAfter(comp.layer(layers[d].index + 1));
                }
            }
            break;
    }
    
    app.endUndoGroup();
    
    return JSON.stringify({ success: true, message: "Sıralama: " + action });
}

// --- Drop Shadow ---

function applyDropShadow(params) {
    var comp = getActiveComp();
    if (!comp) return JSON.stringify({ error: "Kompozisyon seçin!" });
    
    params = JSON.parse(params);
    var action = params.action || "add";
    var shadowOpacity = params.opacity !== undefined ? parseFloat(params.opacity) : 40;
    var shadowDistance = params.distance !== undefined ? parseFloat(params.distance) : 8;
    var shadowSoftness = params.softness !== undefined ? parseFloat(params.softness) : 5;
    
    // Seçili layer'ları kopyala
    var sel = comp.selectedLayers;
    var layers = [];
    if (sel.length > 0) {
        for (var k = 0; k < sel.length; k++) layers.push(sel[k]);
    } else {
        for (var i = 1; i <= comp.numLayers; i++) {
            var l = comp.layer(i);
            if (l.name.indexOf("Shape_") === 0) layers.push(l);
        }
    }
    
    if (layers.length === 0) {
        return JSON.stringify({ error: "Shape layer'ı bulunamadı!" });
    }
    
    app.beginUndoGroup("Shape Animator - Drop Shadow");
    
    var count = 0;
    for (var j = 0; j < layers.length; j++) {
        var layer = layers[j];
        
        if (action === "remove") {
            // Mevcut Drop Shadow efektini kaldır
            try {
                var fxList = layer("Effects");
                for (var e = fxList.numProperties; e >= 1; e--) {
                    if (fxList.property(e).name === "Drop Shadow" || fxList.property(e).matchName === "ADBE Drop Shadow") {
                        fxList.property(e).remove();
                        count++;
                    }
                }
            } catch (re) {}
        } else {
            // Drop Shadow ekle
            try {
                var fx = layer("Effects").addProperty("Drop Shadow");
                // Drop Shadow efekt özellikleri: 1=Opacity, 2=Distance, 3=Softness
                try { fx.property(1).setValue(shadowOpacity); } catch (e1) {}
                try { fx.property(2).setValue(shadowDistance); } catch (e2) {}
                try { fx.property(3).setValue(shadowSoftness); } catch (e3) {}
                count++;
            } catch (ae) {}
        }
    }
    
    app.endUndoGroup();
    
    var msg = action === "remove" ? count + " layer'dan gölge kaldırıldı" : count + " layer'a gölge eklendi";
    return JSON.stringify({ success: true, message: msg });
}

// --- Dispatch ---

function main(command, params) {
    try {
        switch (command) {
            case "createComp":
                return createComposition(params);
            case "createSingleShape":
                return createSingleShape(params);
            case "createGrid":
                return createShapeGrid(params);
            case "duplicate":
                return duplicateShapes(params);
            case "addAnimation":
                return addAnimation(params);
            case "bulkyScatter":
                return bulkyScatter(params);
            case "clearAll":
                return clearAllShapes();
            case "randomizeColors":
                return randomizeColors();
            case "groupSelected":
                return groupSelected(params);
            case "autoNumber":
                return autoNumber(params);
            case "reorder":
                return reorderLayers(params);
            case "dropShadow":
                return applyDropShadow(params);
            case "getCompInfo":
                var comp = getActiveComp();
                if (comp) {
                    return JSON.stringify({
                        name: comp.name,
                        width: comp.width,
                        height: comp.height,
                        duration: comp.duration,
                        frameRate: comp.frameRate,
                        numLayers: comp.numLayers
                    });
                }
                return JSON.stringify({ error: "Kompozisyon yok" });
            default:
                return JSON.stringify({ error: "Bilinmeyen komut: " + command });
        }
    } catch (e) {
        return JSON.stringify({ error: e.toString() });
    }
}

// CSInterface'den evalScript ile çağrıldığında
// CEP yükleme sırasında arguments boş olduğu için sadece çağrılırsa çalışır
if (arguments.length >= 2) {
    main(arguments[0], arguments[1]);
}
