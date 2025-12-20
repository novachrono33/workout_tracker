from typing import List, Dict, Tuple
from app.models.equipment import Equipment

class WeightCalculator:
    @staticmethod
    def calculate_possible_weights(equipment: Equipment) -> List[float]:
        """Рассчитать все возможные веса для данного оборудования"""
        if not equipment:
            return []
        
        return equipment.get_possible_weights()
    
    @staticmethod
    def get_next_possible_weight(equipment: Equipment, current_total_weight: float, direction: str = "up") -> float:
        """Получить следующий возможный вес с учетом доступных дисков"""
        possible_weights = WeightCalculator.calculate_possible_weights(equipment)
        
        if not possible_weights:
            return current_total_weight
            
        if direction == "up":
            # Ищем следующий больший вес
            for weight in possible_weights:
                if weight > current_total_weight:
                    return weight
            return possible_weights[-1]  # Возвращаем максимальный
        else:
            # Ищем следующий меньший вес
            for weight in reversed(possible_weights):
                if weight < current_total_weight:
                    return weight
            return possible_weights[0]  # Возвращаем минимальный
    
    @staticmethod
    def calculate_plates_for_weight(equipment: Equipment, target_total_weight: float) -> Dict:
        """Рассчитать какие диски нужны для достижения целевого веса"""
        if not equipment:
            return {"error": "No equipment specified"}
            
        base_weight = equipment.base_weight
        available_plates = sorted(equipment.get_available_weights_list(), reverse=True)
        
        # Вес, который нужно набрать дисками
        target_plate_weight = target_total_weight - base_weight
        
        if target_plate_weight < 0:
            return {"error": f"Target weight {target_total_weight}kg is less than base weight {base_weight}kg"}
        
        # Рассчитываем комбинацию дисков
        plates_needed = []
        remaining_weight = target_plate_weight / 2  # Делим на 2 для одной стороны
        
        for plate in available_plates:
            while remaining_weight >= plate:
                plates_needed.append(plate)
                remaining_weight -= plate
                remaining_weight = round(remaining_weight, 2)
        
        if abs(remaining_weight) > 0.01:  # Допустимая погрешность
            return {
                "error": f"Cannot achieve exact weight {target_total_weight}kg with available plates",
                "closest_weight": base_weight + sum(plates_needed) * 2,
                "plates_per_side": plates_needed,
                "remaining_weight_per_side": remaining_weight
            }
        
        return {
            "total_weight": target_total_weight,
            "base_weight": base_weight,
            "plate_weight": sum(plates_needed) * 2,
            "plates_per_side": plates_needed,
            "plates_total": plates_needed * 2
        }
    
    @staticmethod
    def validate_weight_possible(equipment: Equipment, weight: float) -> bool:
        """Проверить, возможен ли указанный вес с данным оборудованием"""
        possible_weights = WeightCalculator.calculate_possible_weights(equipment)
        return weight in possible_weights