"""
    Generate password hash
"""
def genhash(key):
    import hashlib
    return hashlib.sha224(key).hexdigest()
