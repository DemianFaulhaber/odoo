/** @odoo-module **/

// Function to apply visual styles to specific fields based on sale_status
function updateFieldsVisualState() {
    console.log('Checking fields visual state...');
    
    // Get the sale_status select element (usando selector más robusto)
    const statusSelect = document.querySelector('select[id*="sale_status"]') || 
                        document.querySelector('[name="sale_status"]') ||
                        document.getElementById('sale_status_0');
    if (!statusSelect) {
        console.log('Status select not found');
        return;
    }
    
    const saleStatus = statusSelect.value.replace(/"/g, '');
    console.log('Current sale_status for fields:', saleStatus);
    
    // Define field selectors (using more flexible selectors instead of just IDs)
    const quotationOnlyFieldSelectors = [
        '[name="partner_id"]',           // Customer field
        '[name="date_order"]',           // Date order field
        '[name="validity_date"]',        // Validity date field  
        '[name="delivery_date"]',        // Delivery date field
        '[name="delivery_method"]',      // Delivery method field
        '[name="discount"]',             // Discount field
        '[name="taxes"]'                 // Taxes field
    ];

    // Define order note fields (disabled when sale_status != 'order_note')
    const orderNoteFieldSelectors = [
        '[id*="order_note_id"]',         // Nota de pedido ID (busca cualquier ID que contenga "order_note_id")
        '[id*="buy_order_"][id$="_0"]',  // Estado nota de compra (busca IDs como "buy_order_0")
        '[id*="buy_order_number"]',      // Número de nota de compra
        '[id*="buy_order_date"]',        // Fecha de nota de compra
        '[id*="order_note_date"]'        // Fecha de nota de pedido (NO incluimos order_note_state que maneja estados)
    ];

    // Define remito fields (disabled when sale_status != 'remito')
    const remitoFieldSelectors = [
        '[id*="remito_number"]',         // Número de remito
        '[id*="remito_date"]'            // Fecha de remito (NO incluimos remito_status que maneja estados)
    ];

    // Define factura fields (disabled when sale_status != 'factura')
    const facturaFieldSelectors = [
        '[id*="bill_number"]',           // Número de factura
        '[id*="bill_date"]'              // Fecha de factura (NO incluimos bill_status que maneja estados)
    ];
    
    // Process quotation fields
    const shouldQuotationBeDisabled = saleStatus !== 'quotation' && saleStatus !== 'false' && saleStatus !== '';
    applyFieldStyles(quotationOnlyFieldSelectors, shouldQuotationBeDisabled, 'quotation');

    // Process order note fields (se deshabilitan cuando sale_status != 'sale_order')
    const shouldOrderNoteBeDisabled = saleStatus !== 'sale_order';
    applyFieldStyles(orderNoteFieldSelectors, shouldOrderNoteBeDisabled, 'sale_order/order_note');

    // Process remito fields  
    const shouldRemitoBeDisabled = saleStatus !== 'remito';
    applyFieldStyles(remitoFieldSelectors, shouldRemitoBeDisabled, 'remito');

    // Process factura fields (se deshabilitan cuando sale_status != 'bill')
    const shouldFacturaBeDisabled = saleStatus !== 'bill';
    applyFieldStyles(facturaFieldSelectors, shouldFacturaBeDisabled, 'bill/factura');
}

// Helper function to apply styles to a group of fields
function applyFieldStyles(fieldSelectors, shouldBeDisabled, groupName) {
    fieldSelectors.forEach(selector => {
        const fieldElements = document.querySelectorAll(selector);
        console.log(`[${groupName}] Selector "${selector}": found ${fieldElements.length} elements`);
        
        fieldElements.forEach((fieldElement, index) => {
            if (fieldElement) {
                console.log(`[${groupName}] Processing field ${index + 1} for selector: ${selector}`);
                
                if (shouldBeDisabled) {
                    // Apply disabled styles
                    fieldElement.style.opacity = '0.6';
                    fieldElement.style.pointerEvents = 'none';
                    fieldElement.style.cursor = 'not-allowed';
                    fieldElement.style.backgroundColor = '#f8f9fa';
                    fieldElement.setAttribute('data-visual-disabled', 'true');
                    console.log(`  - Disabled ${groupName} field: ${selector} (element ${index + 1})`);
                } else {
                    // Remove disabled styles
                    fieldElement.style.opacity = '';
                    fieldElement.style.pointerEvents = '';
                    fieldElement.style.cursor = '';
                    fieldElement.style.backgroundColor = '';
                    fieldElement.removeAttribute('data-visual-disabled');
                    console.log(`  - Enabled ${groupName} field: ${selector} (element ${index + 1})`);
                }
            }
        });
    });
}

// Efficient function to handle Order Lines readonly behavior only
function updateOrderLinesStatus() {
    console.log('Checking Order Lines status...');
    
    // Get the sale_status select element (usando selector más robusto)
    const statusSelect = document.querySelector('select[id*="sale_status"]') || 
                        document.querySelector('[name="sale_status"]') ||
                        document.getElementById('sale_status_0');
    if (!statusSelect) {
        console.log('Status select not found');
        return;
    }
    
    const saleStatus = statusSelect.value.replace(/"/g, '');
    console.log('Current sale_status:', saleStatus);
    
    // Only make Order Lines readonly if not in quotation phase
    const shouldBeReadonly = saleStatus !== 'quotation' && saleStatus !== 'false' && saleStatus !== '';

    if (shouldBeReadonly) {
        console.log('Making Order Lines readonly');
        
        // Find order line elements and make them readonly
        setTimeout(() => {
            const orderLinesField = document.querySelector('[name="order_line"]');
            if (orderLinesField) {
                // Make all input fields readonly (but don't hide buttons - XML handles that)
                const allInputs = orderLinesField.querySelectorAll('input:not([readonly]), select:not([disabled]), textarea:not([readonly])');
                allInputs.forEach(field => {
                    // Add a marker to know we made it readonly
                    field.setAttribute('data-workflow-readonly', 'true');
                    field.setAttribute('readonly', 'readonly');
                    field.style.backgroundColor = '#f8f9fa';
                    field.style.color = '#6c757d';
                    
                    if (field.tagName.toLowerCase() === 'select') {
                        field.setAttribute('disabled', 'disabled');
                    }
                });
                
                // Disable click events on table cells for editing
                const editableCells = orderLinesField.querySelectorAll('.o_data_cell:not([data-workflow-disabled])');
                editableCells.forEach(cell => {
                    cell.setAttribute('data-workflow-disabled', 'true');
                    cell.style.pointerEvents = 'none';
                    cell.style.cursor = 'not-allowed';
                });
                
                // Create an invisible overlay to block all interactions
                let overlay = orderLinesField.querySelector('.workflow-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'workflow-overlay';
                    overlay.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 1000;
                        opacity: 0;
                        background: transparent;
                        pointer-events: auto;
                        cursor: not-allowed;
                    `;
                    
                    // Make the order lines field container relative if it isn't already
                    if (getComputedStyle(orderLinesField).position === 'static') {
                        orderLinesField.style.position = 'relative';
                    }
                    
                    orderLinesField.appendChild(overlay);
                }
                
                // Add visual indicator
                orderLinesField.style.opacity = '0.7';
            }
        }, 200);
    } else {
        console.log('Order Lines should be editable');
        
        // Reset Order Lines to be editable
        const orderLinesField = document.querySelector('[name="order_line"]');
        if (orderLinesField) {
            // Remove readonly from fields that we made readonly
            const workflowReadonlyFields = orderLinesField.querySelectorAll('[data-workflow-readonly="true"]');
            workflowReadonlyFields.forEach(field => {
                field.removeAttribute('data-workflow-readonly');
                field.removeAttribute('readonly');
                field.removeAttribute('disabled');
                field.style.backgroundColor = '';
                field.style.color = '';
            });
            
            // Re-enable click events on cells we disabled
            const workflowDisabledCells = orderLinesField.querySelectorAll('[data-workflow-disabled="true"]');
            workflowDisabledCells.forEach(cell => {
                cell.removeAttribute('data-workflow-disabled');
                cell.style.pointerEvents = '';
                cell.style.cursor = '';
            });
            
            // Remove the overlay
            const overlay = orderLinesField.querySelector('.workflow-overlay');
            if (overlay) {
                overlay.remove();
            }
            
            // Remove visual indicator
            orderLinesField.style.opacity = '';
        }
    }
}

// Setup event listeners - much more efficient than polling
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up Order Lines monitoring...');
    
    // Initial check
    updateOrderLinesStatus();
    updateFieldsVisualState();
    
    // Use MutationObserver to watch for the status select and add listener
    const observer = new MutationObserver(function(mutations) {
        const statusSelect = document.querySelector('select[id*="sale_status"]');
        if (statusSelect && !statusSelect.hasAttribute('data-listener-added')) {
            // Add change event listener
            statusSelect.addEventListener('change', function() {
                updateOrderLinesStatus();
                updateFieldsVisualState();
            });
            statusSelect.setAttribute('data-listener-added', 'true');
            console.log('Added change listener to status select');
            
            // Initial check after finding the select
            updateOrderLinesStatus();
            updateFieldsVisualState();
        }
        
        // Watch for value changes in the sale_status field (for programmatic changes)
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                const target = mutation.target;
                if (target.matches && target.matches('select[id*="sale_status"]')) {
                    console.log('sale_status value changed programmatically');
                    setTimeout(function() {
                        updateOrderLinesStatus();
                        updateFieldsVisualState();
                    }, 50);
                }
            }
        });
        
        // Also check if order lines field was recreated (when switching tabs)
        const orderLinesField = document.querySelector('[name="order_line"]');
        if (orderLinesField && !orderLinesField.hasAttribute('data-workflow-monitored')) {
            orderLinesField.setAttribute('data-workflow-monitored', 'true');
            setTimeout(function() {
                updateOrderLinesStatus();
                updateFieldsVisualState();
            }, 100);
        }
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ['value'] 
    });
    
    // Also listen for form changes (when switching between records)
    document.addEventListener('focusin', function(e) {
        if (e.target.closest('[name="sale_status"]')) {
            setTimeout(function() {
                updateOrderLinesStatus();
                updateFieldsVisualState();
            }, 100);
        }
    });
    
    // Listen for input events on sale_status field
    document.addEventListener('input', function(e) {
        if (e.target.matches && e.target.matches('select[id*="sale_status"]')) {
            console.log('sale_status input changed');
            setTimeout(function() {
                updateOrderLinesStatus();
                updateFieldsVisualState();
            }, 50);
        }
    });
    
    // Add a periodic check for value changes (fallback for programmatic changes)
    let lastStatusValue = '';
    setInterval(function() {
        const statusSelect = document.querySelector('select[id*="sale_status"]');
        if (statusSelect) {
            const currentValue = statusSelect.value;
            if (currentValue !== lastStatusValue) {
                console.log('sale_status value changed from', lastStatusValue, 'to', currentValue);
                lastStatusValue = currentValue;
                updateOrderLinesStatus();
                updateFieldsVisualState();
            }
        }
    }, 1000); // Check every second
    
    // Listen for tab changes to reapply overlay if needed
    document.addEventListener('click', function(e) {
        if (e.target.closest('.nav-link')) {
            setTimeout(function() {
                updateOrderLinesStatus();
                updateFieldsVisualState();
            }, 300);
        }
    });
});

// Run immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        updateOrderLinesStatus();
        updateFieldsVisualState();
    });
} else {
    updateOrderLinesStatus();
    updateFieldsVisualState();
}

// Global function to debug available fields
window.debugAvailableFields = function() {
    console.log('🔍 DEBUG: Available form fields');
    
    const fieldSelectors = [
        // Main form fields
        '[name="partner_id"]',           // Customer field
        '[name="date_order"]',
        '[name="validity_date"]', 
        '[name="delivery_date"]',
        '[name="delivery_method"]',
        '[name="discount"]',
        '[name="taxes"]',
        '[name="quotation_status"]',
        '[name="sale_status"]',
        // Order Note fields (usando selectores más robustos)
        '[id*="order_note_id"]',
        '[id*="buy_order_"][id$="_0"]',  // Específico para el campo principal buy_order
        '[id*="buy_order_number"]',
        '[id*="buy_order_date"]',
        '[id*="order_note_state"]',
        '[id*="order_note_date"]',
        // Remito fields
        '[id*="remito_status"]',
        '[id*="remito_number"]',
        '[id*="remito_date"]',
        // Factura fields
        '[id*="bill_number"]',
        '[id*="bill_status"]',
        '[id*="bill_date"]'
    ];
    
    fieldSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`${selector}: ${elements.length} elements found`);
        elements.forEach((el, index) => {
            console.log(`  ${index + 1}:`, el, {
                id: el.id,
                name: el.name,
                tagName: el.tagName,
                value: el.value || 'N/A',
                classList: Array.from(el.classList)
            });
        });
    });
    
    console.log('\n🏷️ All elements with relevant field IDs (wildcard search):');
    const allFieldElements = document.querySelectorAll('[id*="order_note"], [id*="buy_order"], [id*="remito"], [id*="bill_"], [id*="date_order"], [id*="validity_date"], [id*="delivery_date"], [id*="delivery_method"], [id*="discount"], [id*="taxes"], [id*="quotation_status"]');
    allFieldElements.forEach((el, index) => {
        console.log(`${index + 1}:`, el.id, el.tagName, {
            name: el.name,
            value: el.value || 'N/A'
        });
    });
    
    console.log('\n🎯 Current sale_status value:');
    const statusSelects = document.querySelectorAll('select[id*="sale_status"]');
    statusSelects.forEach((sel, index) => {
        console.log(`${index + 1}: ID="${sel.id}", Value="${sel.value}"`);
    });
};

console.log('💡 Debug function available: debugAvailableFields()');