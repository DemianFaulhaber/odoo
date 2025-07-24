/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { ListRenderer } from "@web/views/list/list_renderer";
import { onMounted } from '@odoo/owl';

patch(ListRenderer.prototype, {
    setup() {
        super.setup();
        onMounted(() => {
            const celdas = document.querySelectorAll('td[name="order_note_state"]');
            celdas.forEach((td) => {
                const texto = td.textContent.trim();

                switch (texto) {
                    case "Emitida":
                        td.style.backgroundColor = "#f8d7da"; // rojo claro
                        td.style.color = "#721c24";           // texto rojo oscuro
                        break;

                    case "En proceso":
                        td.style.backgroundColor = "#fff3cd"; // amarillo claro
                        td.style.color = "#856404";           // texto oscuro
                        break;

                    case "Finalizada":
                        td.style.backgroundColor = "#d4edda"; // verde claro
                        td.style.color = "#155724";           // texto verde oscuro
                        break;
                }}
            );

            const celdas_remito = document.querySelectorAll('td[name="remito_status"]');
            celdas_remito.forEach((td) => {
                const texto = td.textContent.trim();

                switch (texto) {
                    case "Pendiente":
                        td.style.backgroundColor = "#f8d7da"; // rojo claro
                        td.style.color = "#721c24";           // texto rojo oscuro
                        break;

                    case "Emitido":
                        td.style.backgroundColor = "#d4edda"; // verde claro
                        td.style.color = "#155724";           // texto verde oscuro
                        break;
                }}
            );

            const celdas_bill = document.querySelectorAll('td[name="bill_status"]');
            celdas_bill.forEach((td) => {
                const texto = td.textContent.trim();

                switch (texto) {
                    case "Emitida":
                        td.style.backgroundColor = "#f8d7da"; // rojo claro
                        td.style.color = "#721c24";           // texto rojo oscuro
                        break;

                    case "Cobrada":
                        td.style.backgroundColor = "#d4edda"; // verde claro
                        td.style.color = "#155724";           // texto verde oscuro
                        break;
                }}
            );
        });
    }
});