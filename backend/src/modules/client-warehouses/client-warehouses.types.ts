export type AuthUser = {
  id: string;
  role: "admin" | "client" | "partner";
  email: string;
};

export interface CreateWarehouseBody {
  client_id?: string;
  name: string;
  address: string;
  floors_count?: number;
  logistics_hub_id?: string | null;
}

export interface PatchWarehouseBody {
  name?: string;
  address?: string;
  floors_count?: number;
  logistics_hub_id?: string | null;
}

export interface CreateFloorBody {
  level: number;
  label: string;
}

export interface PatchFloorBody {
  level?: number;
  label?: string;
}

export interface CreateAisleBody {
  code: string;
  position_x?: number;
  position_y?: number;
}

export interface PatchAisleBody {
  code?: string;
  position_x?: number;
  position_y?: number;
}

export interface CreateExteriorBody {
  site_width: number;
  site_height: number;
  building_x: number;
  building_y: number;
  building_width: number;
  building_height: number;
  access_direction: "N" | "S" | "E" | "W";
}

export interface PatchExteriorBody {
  site_width?: number;
  site_height?: number;
  building_x?: number;
  building_y?: number;
  building_width?: number;
  building_height?: number;
  access_direction?: "N" | "S" | "E" | "W";
}

export interface CreateDockBody {
  code: string;
  position_x: number;
  position_y: number;
  side: "N" | "S" | "E" | "W";
  max_tonnage?: number;
  max_width_meters?: number;
  status?: "FREE" | "OCCUPIED" | "MAINTENANCE";
  current_order_id?: string | null;
}

export interface CreateParkingBody {
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  capacity: number;
}

export interface PatchParkingBody {
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  capacity?: number;
}
