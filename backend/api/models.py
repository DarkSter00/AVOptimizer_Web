from pydantic import BaseModel

class ScanRequest(BaseModel):
    directory: str
    force_rescan: bool = False

class TargetRequest(BaseModel):
    core_name: str
    sub_name: str

class HashRequest(BaseModel):
    pseudo_hash: str

class OpenFolderRequest(BaseModel):
    path: str