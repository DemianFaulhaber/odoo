/** @odoo-module **/

// Efficient function to handle Order Lines readonly behavior only
function updateOrderLinesStatus() {
    console.log('Checking Order Lines status...');
    
    // Get the sale_status select element
    const statusSelect = document.querySelector('select[id^="sale_status"]') || document.getElementById('sale_status_0');
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
    
    // Use MutationObserver to watch for the status select and add listener
    const observer = new MutationObserver(function(mutations) {
        const statusSelect = document.querySelector('select[id^="sale_status"]');
        if (statusSelect && !statusSelect.hasAttribute('data-listener-added')) {
            // Add change event listener
            statusSelect.addEventListener('change', updateOrderLinesStatus);
            statusSelect.setAttribute('data-listener-added', 'true');
            console.log('Added change listener to status select');
            
            // Initial check after finding the select
            updateOrderLinesStatus();
        }
        
        // Watch for value changes in the sale_status field (for programmatic changes)
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                const target = mutation.target;
                if (target.matches && target.matches('select[id^="sale_status"]')) {
                    console.log('sale_status value changed programmatically');
                    setTimeout(updateOrderLinesStatus, 50);
                }
            }
        });
        
        // Also check if order lines field was recreated (when switching tabs)
        const orderLinesField = document.querySelector('[name="order_line"]');
        if (orderLinesField && !orderLinesField.hasAttribute('data-workflow-monitored')) {
            orderLinesField.setAttribute('data-workflow-monitored', 'true');
            setTimeout(updateOrderLinesStatus, 100);
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
            setTimeout(updateOrderLinesStatus, 100);
        }
    });
    
    // Listen for input events on sale_status field
    document.addEventListener('input', function(e) {
        if (e.target.matches && e.target.matches('select[id^="sale_status"]')) {
            console.log('sale_status input changed');
            setTimeout(updateOrderLinesStatus, 50);
        }
    });
    
    // Add a periodic check for value changes (fallback for programmatic changes)
    let lastStatusValue = '';
    setInterval(function() {
        const statusSelect = document.querySelector('select[id^="sale_status"]');
        if (statusSelect) {
            const currentValue = statusSelect.value;
            if (currentValue !== lastStatusValue) {
                console.log('sale_status value changed from', lastStatusValue, 'to', currentValue);
                lastStatusValue = currentValue;
                updateOrderLinesStatus();
            }
        }
    }, 1000); // Check every second
    
    // Listen for tab changes to reapply overlay if needed
    document.addEventListener('click', function(e) {
        if (e.target.closest('.nav-link')) {
            setTimeout(updateOrderLinesStatus, 300);
        }
    });
});

// Run immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateOrderLinesStatus);
} else {
    updateOrderLinesStatus();
}
