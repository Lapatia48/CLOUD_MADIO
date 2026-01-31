package com.cloud.madio.service;

import com.cloud.madio.entity.Role;
import com.cloud.madio.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class RoleService {
    
    @Autowired
    private RoleRepository roleRepository;

    public List<Role> findAll() {
        return roleRepository.findAll();
    }

    public Optional<Role> findById(Long id) {
        return roleRepository.findById(id);
    }

    public Optional<Role> findByLibelle(String libelle) {
        return roleRepository.findByLibelle(libelle);
    }

    public Role save(Role role) {
        return roleRepository.save(role);
    }
}
