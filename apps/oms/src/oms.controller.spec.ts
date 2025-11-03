import { Test, TestingModule } from '@nestjs/testing';
import { OmsController } from './oms.controller';
import { OmsService } from './oms.service';

describe('OmsController', () => {
  let omsController: OmsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OmsController],
      providers: [OmsService],
    }).compile();

    omsController = app.get<OmsController>(OmsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(omsController.getHello()).toBe('Hello World!');
    });
  });
});
