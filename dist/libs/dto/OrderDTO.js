"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderDto = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["RECEIVED"] = "RECEIVED";
    OrderStatus["RESERVED"] = "RESERVED";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["FULFILLMENT_REQUESTED"] = "FULFILLMENT_REQUESTED";
    OrderStatus["CANCELLED"] = "CANCELLED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
class OrderDto {
    id;
    items;
    status;
    reason;
}
exports.OrderDto = OrderDto;
//# sourceMappingURL=OrderDTO.js.map