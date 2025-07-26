from odoo import models, fields, api
from odoo.tools import config
import os
import logging
import base64


_logger = logging.getLogger(__name__)


class FileManager(models.Model):
    _inherit = "sale.order"

    def write(self, vals):
        """Sobrescribir write para detectar cambios en estados y guardar archivos automáticamente"""
        result = super().write(vals)
        
        # Verificar cambios en quotation_status
        if 'quotation_status' in vals:
            new_status = vals['quotation_status']
            if new_status in ['confirmed', 'approved']:
                for order in self:
                    _logger.info(f"Guardando presupuesto automáticamente para orden {order.name} - nuevo status: {new_status}")
                    order.save_quotation_file()
        
        # Verificar cambios en order_note_state
        if 'order_note_state' in vals:
            new_state = vals['order_note_state']
            if new_state == 'finished':
                for order in self:
                    _logger.info(f"Guardando nota de pedido automáticamente para orden {order.name} - estado: {new_state}")
                    order.save_order_note_file()
        
        return result

    def action_save_quotation(self):
        """Acción manual para guardar presupuesto (sin cambiar estado)"""
        for order in self:
            order.save_quotation_file()
        return True
    
    def action_save_order_note(self):
        """Acción independiente para guardar nota de pedido"""
        for order in self:
            order.save_order_note_file()
        return True

    def save_quotation_file(self):
        """Guardar archivo de presupuesto"""
        files_folder = config.get('sales_folder')

        for order in self:
            try:
                ctx = dict(self.env.context)
                ctx.update({
                    'no_report_file': False,
                    'lang': order.partner_id.lang or 'es_ES',
                })
                
                # Generar contenido del presupuesto
                quotation_content = self.env['ir.actions.report'].with_context(ctx)._render_qweb_pdf(
                    'sale.report_saleorder', [order.id]
                )[0]

                # Configurar directorio y archivo
                output_dir = f'{files_folder}/presupuestos'
                os.makedirs(output_dir, exist_ok=True)
                filename = f'Presupuesto_{order.name}.pdf'
                full_path = os.path.join(output_dir, filename)
                    
                # Guardar archivo
                with open(full_path, 'wb') as f:
                    f.write(quotation_content)

                print(f"Presupuesto guardado en {full_path}")
                _logger.info(f"Presupuesto guardado: {full_path}")

                # Adjuntar al registro
                self.env['ir.attachment'].create({
                    'name': filename,
                    'type': 'binary',
                    'datas': base64.b64encode(quotation_content),
                    'res_model': 'sale.order',
                    'res_id': order.id,
                    'mimetype': 'application/pdf',
                })

            except Exception as e:
                _logger.error(f"Error al guardar el presupuesto {order.name}: {e}")

    def save_order_note_file(self):
        """Guardar archivo de nota de pedido"""
        files_folder = config.get('sales_folder')

        for order in self:
            try:
                ctx = dict(self.env.context)
                ctx.update({
                    'no_report_file': False,
                    'lang': order.partner_id.lang or 'es_ES',
                })
                
                # Generar contenido de la nota de pedido
                ordernote_content = self.env['ir.actions.report'].with_context(ctx)._render_qweb_pdf(
                    'sale_extension.order_note_template', [order.id]
                )[0]

                # Configurar directorio y archivo
                output_dir = f'{files_folder}/ordenes'
                os.makedirs(output_dir, exist_ok=True)
                filename = f'Nota_de_pedido_{order.order_note_id or order.name}.pdf'
                full_path = os.path.join(output_dir, filename)
                    
                # Guardar archivo
                with open(full_path, 'wb') as f:
                    f.write(ordernote_content)

                print(f"Nota de pedido guardada en {full_path}")
                _logger.info(f"Nota de pedido guardada: {full_path}")

                # Adjuntar al registro
                self.env['ir.attachment'].create({
                    'name': filename,
                    'type': 'binary',
                    'datas': base64.b64encode(ordernote_content),
                    'res_model': 'sale.order',
                    'res_id': order.id,
                    'mimetype': 'application/pdf',
                })

            except Exception as e:
                _logger.error(f"Error al guardar la nota de pedido {order.name}: {e}")