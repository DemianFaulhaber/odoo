from odoo import api, fields, models


class SaleOrder(models.Model):
#custom fields

    _inherit='sale.order'


    delivery_date = fields.Date(
        string="Fecha de entrega",
        compute="_compute_delivery_date",
        store=True,
        readOnly=False,
        inverse="_inverse_delivery_date"
    )

    delivery_method = fields.Selection([
        ('pickup_index', 'Se retira en INDEX TECHNOLOGY'),
        ('delivery_address', 'Se entrega en Dirección de entrega'),
        ('freight_buyer', 'Se entrega en expreso a cargo del comprador'),
    ], string="Forma de entrega")


    sale_condition = fields.Selection([
        ('transfer', 'Transferencia'),
        ('30_day_check', 'Cheque a 30 días'),
        ('60_day_check', 'Cheque a 30 / 60 días'),
        ('90_day_check', 'Cheque a 30 / 60 / 90 días')
    ], string="Condición de venta")

    buy_order = fields.Selection([
        ('wpp','WhatsApp'),
        ('email','Email'),
        ('number','Numero')
    ], string="Nota de compra")

    buy_order_number = fields.Integer(string="Buy Order Number")
    
    buy_order_display = fields.Char(
        string="Order Reference",
        compute="_compute_buy_order_display",
        store=True
    )

    buy_order_date = fields.Date(
        string="Buy Order Date",
        help="Date when the buy order was created",
        default=fields.Date.context_today,
        store=True,
    )

    order_note_id = fields.Char(store=True)

    order_note_state= fields.Selection([
        ('emitida', 'Emitida'),
        ('process', 'En proceso'),
        ('finished', 'Finalizada')
    ], string="Estado NP", default='emitida', store=True)

    order_note_date = fields.Date(
        string="Fecha de nota de pedido",
        help="Fecha en la que se emitió la nota de pedido",
        default=fields.Date.context_today,
        store=True,
    )

    remito_status = fields.Selection([
        ('pending', 'Pendiente'),
        ('delivered', 'Emitido')
    ], string="Estado remito", default='pending', store=True)

    remito_number = fields.Char(
        string="Número de remito",
        help="Número de remito asociado a la orden de venta",
        store=True,
    )

    remito_date = fields.Date(
        string="Fecha de remito",
        help="Fecha en la que se emitió el remito",
        default=fields.Date.context_today,
        store=True,
    )

    bill_number=fields.Integer(
        string="Número de factura",
        help="Número de factura asociado a la orden de venta",
        store=True,
    )

    bill_date = fields.Date(
        string="Fecha de factura",
        help="Fecha en la que se emitió la factura",
        default=fields.Date.context_today,
        store=True,
    )

    bill_status = fields.Selection([
        ('issued', 'Emitida'),
        ('billed', 'Cobrada')
    ], string="Estado de factura", default='issued', store=True)

    sale_status = fields.Selection([
        ('quotation', 'Presupuesto'),
        ('sale_order', 'Orden de venta'),
        ('remito', 'Remito'),
        ('invoice', 'Factura')
    ], string="Estado de venta", default='quotation', store=True)

    # Custom computed fields for discount calculations
    amount_untaxed_before_discount = fields.Monetary(
        string='Untaxed Amount', 
        compute='_amount_all_custom', 
        store=True, 
        tracking=5
    )
    amount_discount = fields.Monetary(
        string='Discount', 
        compute='_amount_all_custom', 
        store=True
    )
    amount_untaxed_after_discount = fields.Monetary(
        string='Untaxed Amount After Discount', 
        compute='_amount_all_custom', 
        store=True
    )

    discount = fields.Float(string="Descuento (%)", default=0.0, readonly=False, store=True)

    taxes = fields.Float(string="Impuestos (%)", default=21.0, readonly=False, store=True)

    def _notify_get_email_layout_xmlid(self, message_type=None, subtype_xmlid=None, internal=False):
        return 'sale_extension.custom_mail_notification_layout'

    def print_quotation_report(self):
        return self.env.ref('sale.action_report_saleorder').report_action(self)

    def print_ordernote_report(self):
         return self.env.ref('sale_extension.order_note_pdf').report_action(self)

    #custom computes
    @api.depends('buy_order', 'buy_order_number')
    def _compute_buy_order_display(self):
        for order in self:
            if order.buy_order == 'number' and order.buy_order_number:
                order.buy_order_display = str(order.buy_order_number)
            elif order.buy_order:
                order.buy_order_display = dict(order._fields['buy_order'].selection).get(order.buy_order, '')
            else:
                order.buy_order_display = ''

    @api.depends('order_line.item_delivery_date')
    def _compute_delivery_date(self):
        for order in self:
            try:
                delivery_dates = order.order_line.filtered(lambda l: l.item_delivery_date).mapped('item_delivery_date')
                if delivery_dates:
                    order.delivery_date = max(delivery_dates)
                else:
                    order.delivery_date = False
            except Exception as e:
                    print(e)

    # @api.model
    # def create(self, vals):

    #     order_date = vals.get('date_order')
    #     date = fields.Datetime.to_datetime(order_date) or fields.Datetime.now()

    #     domain = [('name', 'like', f"{date.year}-{date.month:02d}-")]
    #     last_order = self.search(domain, order='id desc', limit=1)
    #     if last_order and last_order.name:
    #         last_seq = int(last_order.name.split('-')[-1])
    #     else:
    #         last_seq = 0

    #     new_number = f"{date.year}-{date.month:02d}-{last_seq + 1}"
    #     vals['name'] = new_number

    #     return super().create(vals)

    @api.model
    def create(self, vals):

        order_date = vals.get('date_order')
        date = fields.Datetime.to_datetime(order_date) or fields.Datetime.now()

        # domain = [('name', 'like', f"{date.year}-{date.month:02d}-")]
        # last_order = self.search(domain, order='id desc', limit=1)
        # if last_order and last_order.name:
        #     last_seq = int(last_order.name.split('-')[-1])
        # else:
        #     last_seq = 0

        # new_number = f"{date.year}-{date.month:02d}-{last_seq + 1}"


        domain = [('name', 'like', f"%-{str(date.year)[2:]}")]
        last_order = self.search(domain, order='id desc', limit=1)
        if last_order and last_order.name:
            last_seq = int(last_order.name.split('-')[0])
        else:
            last_seq = 0

        new_number = f"{last_seq + 1}-{str(date.year)[2:]}"

        vals['name'] = new_number

        return super().create(vals)

    @api.depends('delivery_date')
    def _inverse_delivery_date(self):
        pass

    @api.model
    def action_import_csv(self):
        return {
        }

    @api.depends('sale_status')
    def action_next(self):
        """
        Override the default action_next to handle custom sale statuses
        """
        for order in self:
            if order.sale_status == 'quotation':
                order.sale_status = 'sale_order'
            elif order.sale_status == 'sale_order':
                order.sale_status = 'remito'
            elif order.sale_status == 'remito':
                order.sale_status = 'invoice'
            elif order.sale_status == 'invoice':
                # No next status, stay on invoice
                pass
            else:
                # If status is not recognized, reset to quotation
                order.sale_status = 'quotation'
        return True
    
    @api.depends('sale_status')
    def action_previous(self):
        """
        Override the default action_previous to handle custom sale statuses
        """
        for order in self:
            if order.sale_status == 'invoice':
                order.sale_status = 'remito'
            elif order.sale_status == 'remito':
                order.sale_status = 'sale_order'
            elif order.sale_status == 'sale_order':
                order.sale_status = 'quotation'
            elif order.sale_status == 'quotation':
                # No previous status, stay on quotation
                pass
            else:
                # If status is not recognized, reset to quotation
                order.sale_status = 'quotation'
        return True

    @api.depends('order_line.price_total', 'discount', 'taxes')
    def _amount_all(self):
        """
        Override the default _amount_all to use our custom discount and tax calculation
        """
        return self._amount_all_custom()

    @api.depends('order_line.price_total', 'discount', 'taxes')
    def _amount_all_custom(self):
        """
        Compute the total amounts of the SO with custom discount and tax logic:
        1. Calculate untaxed amount from lines (without any discount)
        2. Apply order-level discount percentage  
        3. Calculate taxes on the discounted amount
        4. Final total
        """
        for order in self:
            # Step 1: Calculate base untaxed amount from order lines
            order.amount_untaxed_before_discount = sum(
                line.price_subtotal for line in order.order_line 
                if not line.display_type
            )
            
            # Step 2: Apply discount
            order.amount_discount = order.amount_untaxed_before_discount * (order.discount / 100.0) if order.discount else 0.0
            order.amount_untaxed_after_discount = order.amount_untaxed_before_discount - order.amount_discount
            
            # Step 3: Calculate taxes on discounted amount
            if order.taxes:
                order.amount_tax = order.amount_untaxed_after_discount * (order.taxes / 100.0)
            else:
                order.amount_tax = sum(line.price_tax for line in order.order_line if not line.display_type)
            
            # Step 4: Final total
            order.amount_total = order.amount_untaxed_after_discount + order.amount_tax
            
            # Update the standard untaxed amount field to reflect discounted amount
            order.amount_untaxed = order.amount_untaxed_after_discount

    @api.onchange('taxes')
    def _onchange_taxes(self):
        """Apply taxes percentage - now handled in _amount_all_custom"""
        # We don't apply taxes to individual lines anymore
        # The taxes will be calculated globally in _amount_all_custom
        pass

    @api.onchange('discount')
    def _onchange_discount(self):
        """Apply discount percentage - now handled in _amount_all_custom"""
        # We don't apply discount to individual lines anymore  
        # The discount will be calculated globally in _amount_all_custom
        pass

    def apply_taxes_to_lines(self):
        """Method to manually apply the taxes percentage to all order lines"""
        self._onchange_taxes()

    def apply_discount_to_lines(self):
        """Method to manually apply the discount percentage to all order lines"""
        self._onchange_discount()


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    # Field to store original price before discount
    original_price_unit = fields.Float(
        string="Original Price Unit",
        help="Stores the original price before applying order-level discount",
        store=False  # Don't store in DB, just in memory
    )

    @api.model_create_multi
    def create(self, vals_list):
        lines = super().create(vals_list)
        for line in lines:
            if not line.display_type:
                line.original_price_unit = line.price_unit
        return lines