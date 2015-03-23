import Queue

"""
    Very simple shared lock object
        
        - Not reentrant (I don't need it to be for my purposes)
        
        - Does not support timeouts (I don't need timeouts)
    
        - Blocks until a lock of the specified type is acquired
        
        - Only one exclusive lock can exist at one time. All attempts to acquire
            either a shared or exclusive lock will block until the existing exclusive
            lock has been released.
            
        - Many shared locks can exist at one time if an exclusive lock has not been acquired.
        
        - If an exclusive lock is waiting to be acquired, attempts to acquire any other type
            of lock will block until the exclusive lock is acquired and released - Exclusive
            lock acquisition requests have priority.
            
        - Exclusive locks are acquired in FIFO order via python's Queue object. Attempts to
            acquire shared locks will block until all pending exclusive lock acquisition
            requests have been fulfilled.
            
"""

class SharedLock(object):
    
    sharedQ = Queue.Queue()
    exclusiveQ = Queue.Queue(1)
    
    def acquire_shared(self):
        """
        Acquire a shared lock
        """
        
        """ Wait until the exclusive queue is empty. This ensures that a shared lock
            can only be acquired when an exclusive lock is not waiting for acquisition """
        self.exclusiveQ.join()
        
        """ Short lived race condition here. Nothing earth shattering. One shared lock
            may be acquired between 2 exclusive locks if an exclusive lock is acquired
            between the above and below statements.
        
            -> the above join() returns
            -> exclusive lock is acquired via another thread (ex1)
            -> the below statement (put()) blocks
            -> another exclusive lock is requested (ex2)
            -> the first exclusive lock (ex1) is released
            -> this shared lock is allowed because put() stops blocking
            -> the second exclusive lock request (ex2) will block until this shared lock is released
        """
            
        self.exclusiveQ.put(1, True)

        """ For this short period of time, nothing else will be able to
            acquire any type of lock on this object """
        
        """ Add shared lock to queue. """
        self.sharedQ.put(1)
        
        """ Release exclusive lock """
        self.exclusiveQ.get_nowait()
        self.exclusiveQ.task_done()
        
        
    def acquire_exclusive(self):
        """
        Acquire an exclusive lock
        """
        
        """ Wait until exclusive lock slot is available """
        self.exclusiveQ.put(1, True)
        
        """ Exclusive lock acquired. Wait until shared locks finish.
            Since the exclusive queue already has an item, all attempts
            to add new shared locks will block """
        self.sharedQ.join()
        
        
    def release_exclusive(self):
        """
        Release the exclusive lock
        """
        self.exclusiveQ.get_nowait()
        self.exclusiveQ.task_done()
        
    def release_shared(self):
        """
        Release a shared lock
        """
        self.sharedQ.get_nowait()
        self.sharedQ.task_done()
        
    acSh = acquire_shared
    acEx = acquire_exclusive
    relSh = release_shared
    relEx = release_exclusive
    acquire = acquire_exclusive
    release = release_exclusive
    
    
